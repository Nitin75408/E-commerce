# 🛒 E-commerce Platform

A full-stack e-commerce platform built with Next.js, featuring a comprehensive seller dashboard and user shopping experience. This platform supports product management, order processing, user reviews, and real-time notifications.

## 🚀 Live Demo

https://e-commerce-lovat-ten-78.vercel.app/

## ✨ Features

### 🛍️ User Features
- **Product Browsing**: Browse products with advanced filtering and search
- **Product Details**: Detailed product pages with images, descriptions, and reviews
- **Shopping Cart**: Add/remove items with real-time cart updates
- **User Authentication**: Secure login/signup with Clerk
- **Order Management**: Place orders and track order history
- **Product Reviews**: Rate and review purchased products
- **Wishlist Notifications**: Get notified when out-of-stock items become available
- **Address Management**: Save and manage shipping addresses
- **Responsive Design**: Mobile-friendly interface

### 🏪 Seller Features
- **Seller Dashboard**: Comprehensive analytics and overview
- **Product Management**: Add, edit, and manage product listings
- **Order Management**: View and process customer orders
- **Sales Analytics**: Revenue tracking and sales insights
- **Inventory Management**: Track product stock and status
- **Review Management**: Monitor and respond to customer reviews
- **Performance Metrics**: Sales charts and performance indicators

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, Redux Toolkit
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: Clerk
- **Background Jobs**: Inngest
- **Email Service**: Resend
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit with RTK Query

### Project Structure
```
E-commerce-main/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── seller/            # Seller dashboard pages
│   ├── product/           # Product detail pages
│   ├── cart/              # Shopping cart
│   ├── my-orders/         # User order history
│   ├── redux/             # Redux store and slices
│   └── customhooks/       # Custom React hooks
├── components/            # Reusable UI components
├── models/               # MongoDB schemas
├── config/               # Configuration files
├── assets/               # Static assets
└── public/               # Public files
```

## 🎯 How It Works

### For Users 👤

#### 1. **Getting Started**
- Visit the homepage to browse products
- Sign up/login using Clerk authentication
- Browse products by category or search

#### 2. **Shopping Experience**
```
Homepage → Product Listing → Product Details → Add to Cart → Checkout → Order Confirmation
```

**Key User Flows:**
- **Product Discovery**: Use search bar or browse categories
- **Product Details**: View images, description, reviews, and pricing
- **Cart Management**: Add items, adjust quantities, view total
- **Checkout Process**: Enter shipping address and confirm order
- **Order Tracking**: View order history and status

#### 3. **User Dashboard Features**
- **My Orders**: Track all past and current orders
- **Address Book**: Manage shipping addresses
- **Reviews**: Rate and review purchased products
- **Notifications**: Get notified about order updates and product availability

### For Sellers 🏪

#### 1. **Seller Onboarding**
- Access seller dashboard at `/seller`
- Manage products and view analytics
- Process customer orders

#### 2. **Product Management**
```
Add Product → Set Details → Upload Images → Set Pricing → Activate → Monitor Sales
```

**Seller Dashboard Features:**
- **Product List**: View all products with status and performance
- **Add/Edit Products**: Manage product details, images, and pricing
- **Inventory Control**: Activate/deactivate products and manage stock
- **Sales Analytics**: View revenue, orders, and performance metrics

#### 3. **Order Processing**
- **Order Notifications**: Real-time notifications for new orders
- **Order Management**: View order details, customer info, and shipping address
- **Status Updates**: Update order status (Processing, Shipped, Delivered)

#### 4. **Analytics & Insights**
- **Revenue Tracking**: Daily, weekly, and monthly revenue charts
- **Sales Performance**: Top-selling products and categories
- **Customer Insights**: Order patterns and customer behavior

## 🔧 Key Features Explained

### 1. **Real-time Notifications**
- **Product Availability**: Users get email notifications when out-of-stock items become available
- **Order Updates**: Email confirmations for order placement and status changes
- **Review Notifications**: Sellers get notified of new customer reviews

### 2. **Advanced Search & Filtering**
- **Search**: Real-time search with debounced API calls
- **Filters**: Category, price range, rating filters
- **Pagination**: Efficient loading of large product catalogs

### 3. **Shopping Cart System**
- **Persistent Cart**: Cart data saved across sessions
- **Real-time Updates**: Instant cart updates without page refresh
- **Guest Cart**: Cart functionality for non-authenticated users

### 4. **Review System**
- **Product Reviews**: Star ratings and written reviews
- **Review Moderation**: Sellers can monitor and respond to reviews
- **Review Analytics**: Average ratings and review counts

### 5. **Background Processing**
- **User Synchronization**: Automatic sync between Clerk and database
- **Order Processing**: Batch order creation for performance
- **Data Cleanup**: Scheduled cleanup of old data
- **Email Notifications**: Automated email sending for various events

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Clerk account for authentication
- Resend account for emails
- Inngest account for background jobs

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd E-commerce-main
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file:
```env
GOOGLE_API_KEY="your google api key";
CLOUDINARY_API_SECRET="your cloudinary api secret";
CLOUDINARY_API_KEY="your cloudinary api key";
CLOUDINARY_CLOUD_NAME="your cloudinary cloud name";
INNGEST_EVENT_KEY="your inngest event key";
INNGEST_SIGNING_KEY="your inngest signing key";
MONGODB_URI="your mongodb uri";
CLERK_SECRET_KEY="your clerk secret key";
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your clerk publishable key";
NEXT_PUBLIC_CURRENCY="₹";
NEXT_PUBLIC_BASE_URL="your hosting_url"
RESEND_API_KEY="your Resend key"

```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## 📱 Usage Guide

### For Users

#### **Browsing Products**
1. Visit the homepage
2. Use the search bar or browse categories
3. Click on products to view details
4. Add items to cart

#### **Making a Purchase**
1. Add products to cart
2. Click cart icon to review items
3. Proceed to checkout
4. Enter shipping address
5. Confirm order

#### **Managing Orders**
1. Go to "My Orders" page
2. View order history and status
3. Track current orders

### For Sellers

#### **Accessing Dashboard**
1. Navigate to `/seller`
2. View analytics and recent orders
3. Manage products and inventory

#### **Adding Products**
1. Go to "Product List" in seller dashboard
2. Click "Add Product"
3. Fill in product details
4. Upload images
5. Set pricing and activate

#### **Managing Orders**
1. View orders in seller dashboard
2. Click on orders to see details
3. Update order status as needed
4. Process shipping information

## 🔒 Security Features

- **Authentication**: Secure user authentication with Clerk
- **Authorization**: Role-based access control
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **Data Protection**: Secure handling of user data

## 📊 Performance Optimizations

- **Server-Side Rendering**: SEO-friendly pages with SSR
- **Image Optimization**: Next.js Image component for optimized images
- **Caching**: Redux caching and browser caching
- **Database Indexing**: Optimized database queries
- **Code Splitting**: Lazy loading for better performance

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📈 Monitoring & Analytics

- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Page load times and API response times
- **User Analytics**: User behavior and conversion tracking
- **Sales Analytics**: Revenue and order tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔮 Future Enhancements

- **Payment Integration**: Stripe/PayPal integration
- **Multi-language Support**: Internationalization
- **Advanced Analytics**: More detailed seller insights
- **Mobile App**: React Native mobile application
- **AI Recommendations**: Product recommendation engine
- **Live Chat**: Customer support chat system

---

**Built with ❤️ using Next.js, MongoDB, and modern web technologies**
