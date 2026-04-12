# CS4218 Project Team 10 - Virtual Vault

## MS1 CI URL
* https://github.com/cs4218/cs4218-2520-ecom-project-cs4218-2520-team10/actions/runs/22291995972/job/64480972725

# MS1 Contribution Summary (Unit Test)

The following table outlines the testing contribution for our 4-member team based on the project architecture.

| Team Member | Feature | Client Related Files (`/client/src/`) | Server Related Files (`./`)
| :--- | :--- | :--- | :--- |
| **Kim Shi Tong A0265858J** | **Auth & Registration** | <ul><li>`context/auth.js`</li><li>`pages/Auth/Register.js`</li><li>`pages/Auth/Login.js`</li></ul> | <ul><li>`helpers/authHelper.js`</li><li>`middlewares/authMiddleware.js`</li><li>`controllers/authController.js` (Register, Login, Forgot, Test)</li></ul> |
| **Yan Weidong A0258151H** | **Orders & Payments** | <ul><li>`pages/user/Orders.js`</li></ul> | <ul><li>`controllers/authController.js` (updateProfileController, getOrdersController, getAllOrdersController, orderStatusController)</li><li>`models/orderModel.js` <li>`controllers/authController.js` (braintreeTokenController, braintreePaymentController)</li></ul> |
| **Ong Chang Heng Bertrand A0253013X** | **Products** | <ul><li>`pages/ProductDetails.js`</li><li>`pages/CategoryProduct.js`</li><li>`pages/admin/CreateProduct.js`</li><li>`pages/admin/UpdateProduct.js`</li><li>`pages/admin/Products.js`</li></ul> | <ul><li>`controllers/productController.js` (getProductController, getSingleProductController, createProductController, updateProductController, deleteProductController)</li><li>`models/productModel.js`</li></ul> |
| **Shaun Lee Xuan Wei A0252626E** | **Categories** | <ul><li>`hooks/useCategory.js`</li><li>`pages/Categories.js`</li><li>`components/Form/CategoryForm.js`</li><li>`pages/admin/CreateCategory.js`</li></ul> | <ul><li>`controllers/categoryController.js` (createCategoryController, updateCategoryController, categoryController, singleCategoryController, deleteCategoryController)</li></ul> |

---

# MS2 Contribution Summary (Integration Test & UI E2E Test)

## Integration Tests

The following table outlines the integration testing contribution for our 4-member team.

| Member | Scope | MS2 Integration Tests | Files Involved |
| :--- | :--- | :--- | :--- |
| **Kim Shi Tong (A0265858J)** | **Auth & Registration** | <ul><li>FE-INT-1 (Login↔AuthContext↔Header)</li><li>FE-INT-2 (Register→Login)</li><li>FE-INT-8 (PrivateRoute↔Auth↔Spinner)</li><li>BE-INT-1 (Auth Controller↔Model↔Helper)</li><li>BE-INT-2 (Auth Route full pipeline)</li></ul> | Login.js, Register.js, auth.js context, Header.js, Private.js, Spinner.js, authController.js, authMiddleware.js, authHelper.js, userModel.js |
| **Yan Weidong (A0258151H)** | **Orders & Payments** | <ul><li>FE-INT-4 (HomePage↔Cart↔CartPage)</li><li>FE-INT-11 (Profile↔AuthContext)</li><li>FE-INT-12 (Orders↔AuthContext)</li><li>BE-INT-5 (Order flow — Controller↔OrderModel↔UserModel↔ProductModel)</li></ul> | HomePage.js, CartPage.js, cart.js context, Profile.js, Orders.js (user), authController.js (order functions), orderModel.js |
| **Ong Chang Heng Bertrand (A0253013X)** | **Products** | <ul><li>FE-INT-5 (ProductDetails↔Cart)</li><li>FE-INT-3 (SearchInput↔SearchContext↔Search)</li><li>BE-INT-4 (Product Controller↔ProductModel↔CategoryModel)</li><li>BE-INT-7 (Product Route pipeline)</li></ul> | ProductDetails.js, SearchInput.js, Search.js, search.js context, productController.js, productModel.js, categoryModel.js |
| **Shaun Lee Xuan Wei (A0252626E)** | **Categories** | <ul><li>FE-INT-6 (Categories↔useCategory)</li><li>FE-INT-7 (Header↔useCategory↔Auth↔Cart)</li><li>FE-INT-9 (AdminRoute↔Auth↔Spinner)</li><li>FE-INT-10 (CreateCategory↔CategoryForm)</li><li>BE-INT-3 (Category Controller↔Model)</li><li>BE-INT-6 (Category Route pipeline)</li></ul> | Categories.js, useCategory.js, Header.js, AdminRoute.js, CreateCategory.js, CategoryForm.js, categoryController.js, categoryModel.js |

## UI E2E Tests

The following table outlines the UI E2E testing contribution for our 4-member team.

| Member | Test Files | Features Tested |
| :--- | :--- | :--- |
| **Kim Shi Tong (A0265858J)** | auth.spec.js, profile.spec.js, route-protection.spec.js | User authentication (login, register, forgot password), user profile management, route protection and access control |
| **Yan Weidong (A0258151H)** | cart.spec.js, checkout.spec.js, user-orders.spec.js | Shopping cart functionality, checkout and payment processing, user order management |
| **Ong Chang Heng Bertrand (A0253013X)** | home.spec.js, product-details.spec.js, admin-products.spec.js, search.spec.js | Home page display, product details and viewing, admin product management (create, update, delete), product search and filtering |
| **Shaun Lee Xuan Wei (A0252626E)** | categories.spec.js, admin-categories.spec.js, admin-orders.spec.js, navigation.spec.js | Category browsing, admin category management, admin order management, site navigation |

---

# MS3 Contribution Summary (Non-Functional Test)

The following table outlines the non-functional testing contribution from our team using Grafana k6.

| Member / Test Type | Files Created | Focus Areas | Key Test Scenarios |
| :--- | :--- | :--- | :--- |
| **Kim Shi Tong (A0265858J)** - **Load Testing** | <ul><li>load-product-browsing.js</li><li>load-search-filter.js</li><li>load-auth-category.js</li><li>load-user-journey.js</li><li>load-mixed-workload.js</li></ul> | <ul><li>Product browsing</li><li>Search & filter</li><li>Auth & category APIs</li><li>User journey simulation</li><li>Concurrent read-write workload</li></ul> | Evaluates system behavior under expected, normal traffic conditions of 50 VUs. |
| **Yan Weidong (A0258151H)** - **Spike Testing** | <ul><li>spike-product-browsing.js</li><li>spike-search-filter.js</li><li>spike-auth.js</li><li>spike-user-journey.js</li><li>spike-categories.js</li></ul> | <ul><li>Product browsing surge</li><li>Search & filter flash sale</li><li>Auth login surge</li><li>Full user journey spike</li><li>Lightweight endpoints spike</li></ul> | Analyze the system behavior when subjected to sudden and extreme spikes in user traffic: Baseline 10 VUs → Instant surge to 500 VUs → Recovery testing at 10 VUs |
| **Shaun Lee Xuan Wei (A0252626E)** - **Stress Testing** | <ul><li>stress-auth.js</li><li>stress-search-filter.js</li><li>stress-product-browsing.js</li><li>stress-combined.js</li><li>stress-category-recovery.js</li></ul> | <ul><li>Auth endpoint breaking point</li><li>Search & filter limits</li><li>Product browsing capacity</li><li>Combined workload stress</li><li>Recovery behavior</li></ul> | Identify breaking points when system escalates to intense load gradually: 50 → 500 VUs |
| **Ong Chang Heng Bertrand (A0253013X)** - **Soak/Endurance Testing** | <ul><li>soak-product-browsing.js</li><li>soak-search-filter.js</li><li>soak-auth-category.js</li><li>soak-user-journey.js</li><li>soak-heavy-payload.js</li></ul> | <ul><li>Product browsing stability</li><li>Search & filter endurance</li><li>Auth & category long-duration</li><li>User journey consistency</li><li>Heavy payload stability</li></ul> | Expose the system to sustained realistic load over an extended duration: 1-hour sustained testing at 30 VUs |

---

## Running Spike Tests (Yan Weidong -A0258151H)

### To run All Spike Tests

```bash
npm run test:spike
```

This will:
1. Seed the database with spike test data
2. Start the server in the background
3. Execute all spike test files in sequence:
   - `spike-auth.js` - Authentication endpoints under spike load
   - `spike-categories.js` - Category browsing under spike load
   - `spike-full-user-journey.js` - Complete user journey simulation
   - `spike-product-browsing.js` - Product browsing endpoints
   - `spike-search-filter.js` - Search and filter functionality
4. Generate JSON reports with detailed metrics
5. Clean up and stop the server

### Running a Specific Spike Test

To run a single spike test file:

```bash
npm run test:spike -- tests/spike/spike-auth.js
```

Or directly with bash:

```bash
bash tests/spike/run-spike-tests.sh tests/spike/spike-product-browsing.js
```

---

## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```
