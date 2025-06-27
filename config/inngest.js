import { Inngest } from "inngest";
import connectDB from "./db";
import { User } from "@/models/user";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Review from "@/models/Review";
import Address from "@/models/address";
import NotifyMe from "@/models/NotifyMe";   
import { clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "ECommerce" });

// Inngest function to save user data to database

export const syncUserCreation = inngest.createFunction({
    id : 'sync-user-from-clerk'
},
  {
    event :'clerk/user.created'
  },
  async ({event})=>{
    const {id,first_name,last_name,email_addresses,image_url} = event.data
    const userData = {
        _id:id,
        email:email_addresses[0].email_address,
        name:first_name + ' ' + last_name,
        imageUrl : image_url
    }

    await connectDB()
    await User.create(userData)
  }
)
// creating function to catch event occure by user whnever he update his profile

export const syncUserUpdation = inngest.createFunction({
    id:'update-user-from-clerk'
},
{
    event:'clerk/user.updated'
},
async({event})=>{

     const {id,first_name,last_name,email_addresses,image_url} = event.data
    const userData = {
        _id:id,
        email:email_addresses[0].email_address,
        name:first_name + ' ' + last_name,
        imageUrl : image_url
    }

    await connectDB()
    await User.findByIdAndUpdate(id,userData);

}
)


// INgest function to delete user from database

export const syncUserDeletion = inngest.createFunction(
    {
        id : 'delete-user-with-clerk'
    },
    {
        event : 'clerk/user.deleted' 
    },
    async({event})=>{
        const { id  } = event.data
        await connectDB();
        await Promise.all([
          User.findByIdAndDelete(id),
          Product.deleteMany({ userId: id }),
          Review.deleteMany({ userId: id }),
          Address.deleteMany({ userId: id })
        ]);
    }
)


// ingst batching func to craete user order in database
export const createUserOrder = inngest.createFunction(
    {
        id : 'create-user-order',
        batchEvents:{
            maxSize : 5,
            timeout : '5s'
        }
    },
        {event:'order/created'},
        async({events})=>{
           const orders = events.map((event)=>{
            return {
                userId:event.data.userId,
            items: event.data.items,
            amount: event.data.amount,
            address : event.data.address,
            date:event.data.date
            }

           })

           await connectDB();
           await Order.insertMany(orders)

           return {success:true,processed : orders.length};
        }
    
)

 export const notifyUsersOnProductActivated = inngest.createFunction(
    { id: "notify-users-on-product-activated" },
    { event: "product.activated" },
    async ({ event }) => {
      const { productId } = event.data;
      await connectDB();
  
      // 1. Find all NotifyMe entries for this product that haven't been notified
      const notifyEntries = await NotifyMe.find({ productId, notified: false });
  
      if (notifyEntries.length === 0) {
        return { message: "No users to notify." };
      }
  
      // 2. Set up Resend client
      const resend = new Resend(process.env.RESEND_API_KEY);
      
    // 3. Notify each user
    for (const entry of notifyEntries) {
        try {
          // Get user email from Clerk
          const user = await clerkClient.users.getUser(entry.userId);
          const email = user.emailAddresses[0]?.emailAddress;
          if (!email) continue;
  
          // Send the email
          await resend.emails.send({
            from: "Your Store <noreply@yourstore.com>",
            to: email,
            subject: "Product Now Active!",
            html: `<p>The product you requested is now active. <a href=\"${process.env.NEXT_PUBLIC_BASE_URL}/product/${productId}\">View Product</a></p>`
          });
  
          // Mark as notified
          entry.notified = true;
          await entry.save();
        } catch (err) {
          // Log errors for individual users, but continue
          console.error(`Failed to notify user ${entry.userId}:`, err);
        }
      }
  
      return { message: "Notifications sent." };
    }
  );