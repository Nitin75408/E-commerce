import { Inngest } from "inngest";
import connectDB from "./db";
import { User } from "@/models/user";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Review from "@/models/Review";
import Address from "@/models/address";
import NotifyMe from "@/models/NotifyMe";   
import { Resend } from 'resend';
import { Clerk } from "@clerk/clerk-sdk-node";

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
    
      const notifyEntries = await NotifyMe.find({ productId, notified: false });
      let debug = [];
      if (notifyEntries.length === 0) {
        return { message: "No users to notify.", debug };
      }
    
      const resend = new Resend(process.env.RESEND_API_KEY);
      const clerk = new Clerk({ apiKey: process.env.CLERK_SECRET_KEY });
    
      for (const entry of notifyEntries) {
        try {
          debug.push(`Processing user: ${entry.userId}`);
          const user = await clerk.users.getUser(entry.userId);
          debug.push(`Fetched user: ${JSON.stringify(user)}`);
          const email = user.emailAddresses[0]?.emailAddress;
          debug.push(`Fetched email: ${email}`);
          if (!email) {
            debug.push(`No email for user: ${entry.userId}`);
            continue;
          }
          const emailResult = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Product Now Active!",
            html: `<p>The product you requested is now active. <a href=\"${process.env.NEXT_PUBLIC_BASE_URL}/product/${productId}\">View Product</a></p>`
          });
          debug.push(`Email send result: ${JSON.stringify(emailResult)}`);
          entry.notified = true;
          await entry.save();
          debug.push(`Marked as notified: ${entry.userId}`);
        } catch (err) {
          debug.push(`Error for user ${entry.userId}: ${err.message}`);
        }
      }
    
      return {
        message: "Notifications sent.",
        notifiedUserIds: notifyEntries.map(e => e.userId),
        notifyEntriesCount: notifyEntries.length,
        productId,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        clerkKey: process.env.CLERK_SECRET_KEY,
        mongoUri: process.env.MONGODB_URI,
        resend: process.env.RESEND_API_KEY,
        debug
      };
    }
  );