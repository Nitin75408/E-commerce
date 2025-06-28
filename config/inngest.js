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
      let successCount = 0;
      let errorCount = 0;
      
      if (notifyEntries.length === 0) {
        return { message: "No users to notify.", debug };
      }

      // Get product details for better email content
      const product = await Product.findById(productId);
      if (!product) {
        return { message: "Product not found.", debug };
      }
    
      const resend = new Resend(process.env.RESEND_API_KEY);
      const clerk = new Clerk({ apiKey: process.env.CLERK_SECRET_KEY });
    
      for (const entry of notifyEntries) {
        try {
          debug.push(`Processing user: ${entry.userId}`);
          const user = await clerk.users.getUser(entry.userId);
          const email = user.emailAddresses[0]?.emailAddress;
          
          if (!email) {
            debug.push(`No email for user: ${entry.userId}`);
            errorCount++;
            continue;
          }

          // Enhanced email template
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">🎉 Great News! Product is Back in Stock</h2>
              <p>Hi ${user.firstName || 'there'},</p>
              <p>The product you were waiting for is now available again!</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">${product.name}</h3>
                <p style="color: #666;">${product.description?.substring(0, 100)}${product.description?.length > 100 ? '...' : ''}</p>
                <p style="font-size: 18px; font-weight: bold; color: #28a745;">
                  Price: $${product.offerPrice || product.price}
                </p>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/product/${productId}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Product Now
              </a>
              
              <p style="margin-top: 30px; font-size: 12px; color: #666;">
                You're receiving this email because you requested to be notified when this product becomes available.
              </p>
            </div>
          `;

          const emailResult = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: `🎉 ${product.name} is Back in Stock!`,
            html: emailHtml
          });
          
          entry.notified = true;
          await entry.save();
          successCount++;
          debug.push(`Email sent successfully to: ${email}`);
          
        } catch (err) {
          errorCount++;
          debug.push(`Error for user ${entry.userId}: ${err.message}`);
        }
      }
    
      return {
        message: "Notifications processed.",
        successCount,
        errorCount,
        totalProcessed: notifyEntries.length,
        productId,
        productName: product.name,
        debug
      };
    }
  );

// Function to reset notified flag when product becomes inactive
export const resetNotificationsOnProductDeactivated = inngest.createFunction(
    { id: "reset-notifications-on-product-deactivated" },
    { event: "product.deactivated" },
    async ({ event }) => {
      const { productId } = event.data;
      await connectDB();
    
      // Reset all notified flags to false for this product
      const result = await NotifyMe.updateMany(
        { productId },
        { $set: { notified: false } }
      );
    
      return {
        message: "Notifications reset for product deactivation.",
        productId,
        resetCount: result.modifiedCount,
        totalEntries: result.matchedCount
      };
    }
  );

// Function to send order confirmation emails
export const sendOrderConfirmationEmail = inngest.createFunction(
    { id: "send-order-confirmation-email" },
    { event: "order.confirmation" },
    async ({ event }) => {
      const { userId, address, items, amount, date } = event.data;
      await connectDB();
    
      const resend = new Resend(process.env.RESEND_API_KEY);
      const clerk = new Clerk({ apiKey: process.env.CLERK_SECRET_KEY });
    
      try {
        // Get user details
        const user = await clerk.users.getUser(userId);
        const email = user.emailAddresses[0]?.emailAddress;
        
        if (!email) {
          return { message: "No email found for user", userId };
        }

        // Get product details for the email
        const productDetails = await Promise.all(
          items.map(async (item) => {
            const product = await Product.findById(item.product);
            return {
              name: product?.name || 'Unknown Product',
              price: product?.offerPrice || product?.price || 0,
              quantity: item.quantity,
              total: (product?.offerPrice || product?.price || 0) * item.quantity
            };
          })
        );

        const orderDate = new Date(date).toLocaleDateString();
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">🎉 Order Confirmed!</h2>
            <p>Hi ${user.firstName || 'there'},</p>
            <p>Thank you for your order! We've received your order and it's being processed.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Order Summary</h3>
              <p><strong>Order Date:</strong> ${orderDate}</p>
              <p><strong>Total Items:</strong> ${totalItems}</p>
              <p><strong>Total Amount:</strong> ₹${amount.toFixed(2)}</p>
              
              <h4>Items Ordered:</h4>
              ${productDetails.map(item => `
                <div style="border-bottom: 1px solid #ddd; padding: 10px 0;">
                  <p style="margin: 5px 0;"><strong>${item.name}</strong></p>
                  <p style="margin: 5px 0; color: #666;">Quantity: ${item.quantity} × $${item.price.toFixed(2)} = ₹${item.total.toFixed(2)}</p>
                </div>
              `).join('')}
            </div>
            
            <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Shipping Address:</h4>
              <p style="margin: 5px 0;">${address.street || ''}</p>
              <p style="margin: 5px 0;">${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}</p>
              <p style="margin: 5px 0;">${address.country || ''}</p>
            </div>
            
            <p>We'll send you another email when your order ships!</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        `;

        const emailResult = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: email,
          subject: "🎉 Order Confirmed - Thank You!",
          html: emailHtml
        });

        return {
          message: "Order confirmation email sent successfully",
          userId,
          email,
          orderAmount: amount,
          itemsCount: items.length
        };

      } catch (error) {
        return {
          message: "Failed to send order confirmation email",
          userId,
          error: error.message
        };
      }
    }
  );

// Function to notify sellers about new reviews
export const notifySellerAboutReview = inngest.createFunction(
    { id: "notify-seller-about-review" },
    { event: "review/added" },
    async ({ event }) => {
      const { reviewId, productId, userId, rating, comment } = event.data;
      await connectDB();
    
      try {
        // Get product and seller details
        const product = await Product.findById(productId);
        if (!product) {
          return { message: "Product not found", productId };
        }

        // Get reviewer details
        const clerk = new Clerk({ apiKey: process.env.CLERK_SECRET_KEY });
        const reviewer = await clerk.users.getUser(userId);
        const reviewerName = reviewer.firstName || 'Anonymous';

        // Get seller details
        const seller = await clerk.users.getUser(product.userId);
        const sellerEmail = seller.emailAddresses[0]?.emailAddress;

        if (!sellerEmail) {
          return { message: "Seller email not found", sellerId: product.userId };
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        // Create star rating display
        const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">📝 New Review Received!</h2>
            <p>Hi ${seller.firstName || 'there'},</p>
            <p>You've received a new review for your product!</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${product.name}</h3>
              <p style="font-size: 18px; margin: 10px 0;">${stars}</p>
              <p style="color: #666; font-style: italic;">"${comment}"</p>
              <p style="margin-top: 15px; font-size: 14px; color: #888;">
                - ${reviewerName}
              </p>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/seller/product-list" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View All Reviews
            </a>
            
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Keep up the great work! Positive reviews help boost your product visibility.
            </p>
          </div>
        `;

        const emailResult = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: sellerEmail,
          subject: `📝 New ${rating}-Star Review for ${product.name}`,
          html: emailHtml
        });

        return {
          message: "Seller notification sent successfully",
          productId,
          productName: product.name,
          sellerId: product.userId,
          reviewerName,
          rating,
          reviewId
        };

      } catch (error) {
        return {
          message: "Failed to send seller notification",
          error: error.message,
          productId,
          reviewId
        };
      }
    }
  );

// Scheduled function to clean up old data (runs daily)
export const cleanupOldData = inngest.createFunction(
    { 
        id: "cleanup-old-data"
    },
    { cron: "0 2 * * *" }, // Run at 2 AM daily
    async ({ step }) => {
      await step.run("connect-database", async () => {
        await connectDB();
      });
    
      const result = await step.run("cleanup-data", async () => {
        try {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          // Clean up old notification requests (older than 30 days)
          const notifyMeResult = await NotifyMe.deleteMany({
            createdAt: { $lt: thirtyDaysAgo }
          });

          // Clean up old orders (older than 1 year) - optional
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          const orderResult = await Order.deleteMany({
            createdAt: { $lt: oneYearAgo },
            status: { $in: ['Delivered', 'Cancelled'] }
          });

          return {
            message: "Data cleanup completed",
            notifyMeDeleted: notifyMeResult.deletedCount,
            ordersDeleted: orderResult.deletedCount,
            cleanupDate: new Date().toISOString()
          };

        } catch (error) {
          throw new Error(`Data cleanup failed: ${error.message}`);
        }
      });

      return result;
    }
  );