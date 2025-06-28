import { serve } from "inngest/next";
import { createUserOrder, inngest, syncUserCreation, syncUserDeletion, syncUserUpdation, notifyUsersOnProductActivated
  ,cleanupOldData,sendOrderConfirmationEmail,notifySellerAboutReview
 }  from "@/config/inngest"

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
     syncUserCreation,
     syncUserDeletion,
     syncUserUpdation,
     createUserOrder,
     notifyUsersOnProductActivated,
     cleanupOldData,
     sendOrderConfirmationEmail,
     notifySellerAboutReview
  ],
}); 