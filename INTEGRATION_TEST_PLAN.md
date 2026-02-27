# MS2 Integration Test Plan — Virtual Vault (Team 10)

## Table of Contents

- [1. Project Architecture Overview](#1-project-architecture-overview)
- [2. Full File-by-File Function Reference](#2-full-file-by-file-function-reference)
- [3. MS1 Unit Test Summary (What Was Isolated)](#3-ms1-unit-test-summary-what-was-isolated)
- [4. Integration Test Strategy & Approach](#4-integration-test-strategy--approach)
- [5. Frontend Integration Tests — Detailed Plan](#5-frontend-integration-tests--detailed-plan)
- [6. Backend Integration Tests — Detailed Plan](#6-backend-integration-tests--detailed-plan)
- [7. Component Dependency Graph](#7-component-dependency-graph)
- [8. Suggested Member Allocation](#8-suggested-member-allocation)

---

## 1. Project Architecture Overview

```
Virtual Vault — MERN E-commerce App
├── client/src/                    (React Frontend)
│   ├── context/                   (Global State: auth, cart, search)
│   ├── hooks/                     (Custom Hooks: useCategory)
│   ├── components/                (Reusable UI: Header, Layout, Spinner, Menus, Forms, Routes)
│   ├── pages/
│   │   ├── auth/                  (Login.js, Register.js)
│   │   ├── admin/                 (CreateCategory, CreateProduct, UpdateProduct, Products, AdminOrders)
│   │   ├── user/                  (Dashboard, Orders, Profile)
│   │   ├── HomePage.js, CartPage.js, ProductDetails.js, CategoryProduct.js, Categories.js, Search.js
│   │   └── About.js, Contact.js, Policy.js, Pagenotfound.js
│   └── App.js                     (Route Definitions)
│
├── controllers/                   (Express Route Handlers)
│   ├── authController.js          (register, login, forgotPassword, test, updateProfile, orders)
│   ├── categoryController.js      (CRUD categories)
│   └── productController.js       (CRUD products, search, filter, pagination, payment)
│
├── routes/                        (Express Route Definitions)
│   ├── authRoute.js               (maps /api/v1/auth/*)
│   ├── categoryRoutes.js          (maps /api/v1/category/*)
│   └── productRoutes.js           (maps /api/v1/product/*)
│
├── middlewares/
│   └── authMiddleware.js          (requireSignIn, isAdmin)
│
├── helpers/
│   └── authHelper.js              (hashPassword, comparePassword)
│
├── models/                        (Mongoose Schemas)
│   ├── userModel.js
│   ├── categoryModel.js
│   ├── productModel.js
│   └── orderModel.js
│
├── constants/
│   └── orderStatus.js             (ORDER_STATUS enum, list, default)
│
├── config/db.js                   (MongoDB connection)
└── server.js                      (Express app setup, route mounting, Swagger)
```

---

## 2. Full File-by-File Function Reference

### 2.1 Backend Files

#### `controllers/authController.js`
| Function | Lines | What It Does | Uses (Models/Helpers) | API Route |
|----------|-------|-------------|----------------------|-----------|
| `registerController` | 8-65 | Validates fields (name, email, password, phone, address, answer), checks duplicate email, hashes password, saves new user | `userModel.findOne`, `userModel.save`, `hashPassword` | `POST /api/v1/auth/register` |
| `loginController` | 68-118 | Validates email/password, finds user, compares password hash, generates JWT (7d expiry) | `userModel.findOne`, `comparePassword`, `JWT.sign` | `POST /api/v1/auth/login` |
| `forgotPasswordController` | 121-157 | Validates email/answer/newPassword, finds user by email+answer, hashes new password, updates | `userModel.findOne`, `userModel.findByIdAndUpdate`, `hashPassword` | `POST /api/v1/auth/forgot-password` |
| `testController` | 161-175 | Simple protected route test — returns success if middleware passes | None | `GET /api/v1/auth/test` |
| `updateProfileController` | 179-224 | Updates user name/password/phone/address (password min 6 chars), returns updated user | `userModel.findById`, `userModel.findByIdAndUpdate`, `hashPassword` | `PUT /api/v1/auth/profile` |
| `getOrdersController` | 227-242 | Finds orders by buyer ID, populates products (-photo) and buyer (name) | `orderModel.find`, `.populate("products")`, `.populate("buyer")` | `GET /api/v1/auth/orders` |
| `getAllOrdersController` | 245-261 | Finds all orders, populates products and buyer, sorts by createdAt desc | `orderModel.find`, `.populate`, `.sort` | `GET /api/v1/auth/all-orders` |
| `orderStatusController` | 264-313 | Validates orderId (ObjectId) and status (enum), updates order status | `orderModel.findByIdAndUpdate`, `ORDER_STATUS_LIST` | `PUT /api/v1/auth/order-status/:orderId` |

#### `controllers/categoryController.js`
| Function | Lines | What It Does | Uses | API Route |
|----------|-------|-------------|------|-----------|
| `createCategoryController` | 4-37 | Validates name (non-empty, non-whitespace), checks duplicate, creates slug, saves | `categoryModel.findOne`, `categoryModel.save`, `slugify` | `POST /api/v1/category/create-category` |
| `updateCategoryController` | 40-94 | Validates name + id (ObjectId), checks duplicate name, updates name + slug | `categoryModel.findOne`, `categoryModel.findByIdAndUpdate`, `slugify` | `PUT /api/v1/category/update-category/:id` |
| `categoryController` | 97-113 | Returns all categories | `categoryModel.find({})` | `GET /api/v1/category/get-category` |
| `singleCategoryController` | 116-149 | Validates slug, finds category by slug | `categoryModel.findOne({ slug })` | `GET /api/v1/category/single-category/:slug` |
| `deleteCategoryController` | 152-182 | Validates id (ObjectId), deletes category, checks if found | `categoryModel.findByIdAndDelete` | `DELETE /api/v1/category/delete-category/:id` |

#### `controllers/productController.js`
| Function | Lines | What It Does | Uses | API Route |
|----------|-------|-------------|------|-----------|
| `createProductController` | 21-77 | Validates all product fields + photo size, checks duplicate slug, saves with photo buffer | `productModel.findOne`, `productModel.save`, `slugify`, `fs.readFileSync` | `POST /api/v1/product/create-product` |
| `getProductController` | 80-104 | Returns 12 most recent products (no photo), populated with category | `productModel.find`, `.populate("category")`, `.select("-photo")`, `.limit(12)` | `GET /api/v1/product/get-product` |
| `getSingleProductController` | 107-135 | Finds product by slug, populates category | `productModel.findOne({ slug })`, `.populate("category")` | `GET /api/v1/product/get-product/:slug` |
| `productPhotoController` | 138-153 | Returns product photo binary data with content-type header | `productModel.findById().select("photo")` | `GET /api/v1/product/product-photo/:pid` |
| `deleteProductController` | 156-179 | Deletes product by ID, checks existence | `productModel.findByIdAndDelete` | `DELETE /api/v1/product/delete-product/:pid` |
| `updateProductController` | 182-251 | Validates fields, checks duplicate slug (excluding self), updates + optional photo | `productModel.findOne`, `productModel.findByIdAndUpdate`, `productModel.save` | `PUT /api/v1/product/update-product/:pid` |
| `productFiltersController` | 254-273 | Filters by checked categories + price range [min, max] | `productModel.find(args)` with `$gte/$lte` | `POST /api/v1/product/product-filters` |
| `productCountController` | 276-291 | Returns estimated total product count | `productModel.find({}).estimatedDocumentCount()` | `GET /api/v1/product/product-count` |
| `productListController` | 294-316 | Paginated product list, 6 per page, sorted by createdAt desc | `productModel.find().skip().limit().sort()` | `GET /api/v1/product/product-list/:page` |
| `searchProductController` | 319-339 | Regex search on product name + description (case-insensitive) | `productModel.find({ $or: [name regex, desc regex] })` | `GET /api/v1/product/search/:keyword` |
| `realtedProductController` | 342-365 | Finds 3 products in same category, excludes current product | `productModel.find({ category: cid, _id: { $ne: pid } }).limit(3)` | `GET /api/v1/product/related-product/:pid/:cid` |
| `productCategoryController` | 368-385 | Finds category by slug, then all products in that category | `categoryModel.findOne({ slug })`, `productModel.find({ category })` | `GET /api/v1/product/product-category/:slug` |
| `braintreeTokenController` | 389-409 | Generates Braintree client token for payment | `gateway.clientToken.generate` | `GET /api/v1/product/braintree/token` |
| `braintreePaymentController` | 413-477 | Validates nonce/cart/prices, processes payment, creates order | `gateway.transaction.sale`, `orderModel.save` | `POST /api/v1/product/braintree/payment` |

#### `middlewares/authMiddleware.js`
| Function | Lines | What It Does | Uses |
|----------|-------|-------------|------|
| `requireSignIn` | 5-21 | Verifies JWT from `req.headers.authorization`, attaches decoded payload to `req.user`, returns 401 if invalid/expired | `JWT.verify`, `process.env.JWT_SECRET` |
| `isAdmin` | 24-43 | Checks if `user.role === 1`, returns 401 if not admin | `userModel.findById(req.user._id)` |

#### `helpers/authHelper.js`
| Function | Lines | What It Does |
|----------|-------|-------------|
| `hashPassword` | 3-12 | Hashes password with bcrypt (10 salt rounds) |
| `comparePassword` | 14-16 | Compares plain password with bcrypt hash |

#### Models
| File | Model Name | Key Fields | Relationships |
|------|-----------|------------|---------------|
| `models/userModel.js` | `users` | name, email (unique), password, phone, address, answer, role (default 0) | — |
| `models/categoryModel.js` | `Category` | name, slug (lowercase) | — |
| `models/productModel.js` | `Products` | name, slug, description, price, category (ref→Category), quantity, photo (Buffer), shipping | `category` → Category |
| `models/orderModel.js` | `Order` | products (ref→Products[]), payment (Mixed), buyer (ref→users), status (enum) | `products` → Products, `buyer` → users |

---

### 2.2 Frontend Files

#### Context (Global State)
| File | Exports | What It Does | Dependencies |
|------|---------|-------------|--------------|
| `context/auth.js` | `useAuth`, `AuthProvider` | Stores `{user, token}`, inits from localStorage, sets `axios.defaults.headers.common["Authorization"]` | axios |
| `context/cart.js` | `useCart`, `CartProvider` | Stores cart array, inits from localStorage | — |
| `context/search.js` | `useSearch`, `SearchProvider` | Stores `{keyword, results}`, populated by SearchInput | — |

#### Hooks
| File | Exports | What It Does | API Call |
|------|---------|-------------|----------|
| `hooks/useCategory.js` | `useCategory()` | Returns `{categories, loading, error}` fetched on mount | `GET /api/v1/category/get-category` |

#### Components
| File | Exports | Key Integrations |
|------|---------|-----------------|
| `components/Header.js` | `Header` | Uses `useAuth`, `useCart`, `useCategory` hook, renders `SearchInput`, shows dynamic nav (login/register vs dashboard/logout), category dropdown, cart badge |
| `components/Layout.js` | `Layout` | Wraps pages with Header, Footer, Helmet (meta tags), Toaster |
| `components/Form/SearchInput.js` | `SearchInput` | Uses `useSearch` context, calls `GET /api/v1/product/search/:keyword`, navigates to `/search` |
| `components/Form/CategoryForm.js` | `CategoryForm` | Pure presentational form — accepts `handleSubmit`, `value`, `setValue` as props |
| `components/Routes/Private.js` | `PrivateRoute` | Uses `useAuth`, calls `GET /api/v1/auth/user-auth`, shows `Spinner` or `Outlet` |
| `components/Routes/AdminRoute.js` | `AdminRoute` | Uses `useAuth`, calls `GET /api/v1/auth/admin-auth`, shows `Spinner` or `Outlet` |
| `components/Spinner.js` | `Spinner` | Countdown timer (default 3s), then redirects to `/login` (or custom path), stores current location in state |
| `components/AdminMenu.js` | `AdminMenu` | Static NavLinks to admin pages |
| `components/UserMenu.js` | `UserMenu` | Static NavLinks to user pages |

#### Pages — Auth
| File | Exports | Key Integrations | API Calls |
|------|---------|-----------------|-----------|
| `pages/auth/Login.js` | `Login` | Uses `Layout`, `useAuth` (sets auth on success), `useNavigate`, `useLocation`, `toast` | `POST /api/v1/auth/login` |
| `pages/auth/Register.js` | `Register` | Uses `Layout`, `useNavigate`, `toast` | `POST /api/v1/auth/register` |

#### Pages — Shopping
| File | Exports | Key Integrations | API Calls |
|------|---------|-----------------|-----------|
| `pages/HomePage.js` | `HomePage` | Uses `Layout`, `useCart`, Checkbox/Radio (antd), `Prices` | `GET /category/get-category`, `GET /product/product-list/:page`, `GET /product/product-count`, `POST /product/product-filters` |
| `pages/ProductDetails.js` | `ProductDetails` | Uses `Layout`, `useCart`, `useParams`, `useNavigate` | `GET /product/get-product/:slug`, `GET /product/related-product/:pid/:cid` |
| `pages/CategoryProduct.js` | `CategoryProduct` | Uses `Layout`, `useCart`, `useParams`, `useNavigate` | `GET /product/product-category/:slug` |
| `pages/Categories.js` | `Categories` | Uses `Layout`, `useCategory` hook, `Link` | None (hook does API call) |
| `pages/Search.js` | `Search` | Uses `Layout`, `useSearch` context | None (context populated by SearchInput) |
| `pages/CartPage.js` | `CartPage` | Uses `Layout`, `useCart`, `useAuth`, DropIn (braintree), `toast` | `GET /product/braintree/token`, `POST /product/braintree/payment` |

#### Pages — User
| File | Exports | Key Integrations | API Calls |
|------|---------|-----------------|-----------|
| `pages/user/Dashboard.js` | `Dashboard` | Uses `Layout`, `UserMenu`, `useAuth` | None |
| `pages/user/Orders.js` | `Orders` | Uses `Layout`, `UserMenu`, `useAuth`, `moment` | `GET /auth/orders` |
| `pages/user/Profile.js` | `Profile` | Uses `Layout`, `UserMenu`, `useAuth`, `toast` | `PUT /auth/profile` |

#### Pages — Admin
| File | Exports | Key Integrations | API Calls |
|------|---------|-----------------|-----------|
| `pages/admin/CreateCategory.js` | `CreateCategory` | Uses `Layout`, `AdminMenu`, `CategoryForm`, Modal (antd), `toast` | `GET /category/get-category`, `POST /category/create-category`, `PUT /category/update-category/:id`, `DELETE /category/delete-category/:id` |
| `pages/admin/CreateProduct.js` | `CreateProduct` | Uses `Layout`, `AdminMenu`, Select (antd), `useNavigate` | `GET /category/get-category`, `POST /product/create-product` |
| `pages/admin/UpdateProduct.js` | `UpdateProduct` | Uses `Layout`, `AdminMenu`, Select (antd), `useParams`, `useNavigate` | `GET /product/get-product/:slug`, `GET /category/get-category`, `PUT /product/update-product/:id`, `DELETE /product/delete-product/:id` |
| `pages/admin/Products.js` | `Products` | Uses `Layout`, `AdminMenu`, `Link` | `GET /product/get-product` |
| `pages/admin/AdminOrders.js` | `AdminOrders` | Uses `Layout`, `AdminMenu`, `useAuth`, Select (antd), `moment`, `ORDER_STATUS_LIST` | `GET /auth/all-orders`, `PUT /auth/order-status/:orderId` |

---

## 3. MS1 Unit Test Summary (What Was Isolated)

**Key Principle:** In MS1, every component was tested in **complete isolation**. All external dependencies were mocked. MS2 integration tests must **remove some of those mocks** to test real interactions.

### 3.1 Frontend Unit Tests — What Was Mocked

| Test File | Component Under Test | What Was Mocked |
|-----------|---------------------|-----------------|
| `Login.test.js` | Login | axios, toast, useNavigate, useAuth, useCart, useSearch, localStorage |
| `Register.test.js` | Register | axios, toast, useNavigate, useAuth, useCart, useSearch |
| `Categories.test.js` | Categories | axios (via useCategory), Layout |
| `CategoryProduct.test.js` | CategoryProduct | axios, useNavigate, useParams, useCart, Layout, toast |
| `ProductDetails.test.js` | ProductDetails | axios, useNavigate, useParams, useCart, Layout, toast |
| `CreateCategory.test.js` | CreateCategory | axios, toast, Layout, AdminMenu |
| `CreateProduct.test.js` | CreateProduct | axios, useNavigate, toast, Layout, AdminMenu, antd Select |
| `Products.test.js` | Products | axios, Layout, AdminMenu |
| `UpdateProduct.test.js` | UpdateProduct | axios, useNavigate, useParams, toast, Layout, AdminMenu, antd Select |
| `Orders.test.js` | Orders (user) | axios, moment, useAuth, Layout, UserMenu, localStorage |
| `auth.test.js` | AuthProvider | axios, localStorage |
| `useCategory.test.js` | useCategory | axios |
| `CategoryForm.test.js` | CategoryForm | Nothing (pure component) |

### 3.2 Backend Unit Tests — What Was Mocked

| Test File | Controller/Unit Under Test | What Was Mocked |
|-----------|---------------------------|-----------------|
| `registerController.test.js` | registerController | userModel, hashPassword, JWT.sign |
| `loginController.test.js` | loginController | userModel, comparePassword, JWT.sign |
| `forgotPasswordController.test.js` | forgotPasswordController | userModel, hashPassword |
| `testController.test.js` | testController | None (trivial function) |
| `categoryController.test.js` | All category controllers | categoryModel, slugify, mongoose.ObjectId |
| `productController.test.js` | All product controllers | productModel, fs, slugify |
| `updateProfileController.test.js` | updateProfileController | userModel, hashPassword |
| `getOrdersController.test.js` | getOrdersController | orderModel |
| `getAllOrdersController.test.js` | getAllOrdersController | orderModel |
| `orderStatusController.test.js` | orderStatusController | orderModel, mongoose.ObjectId |
| `brainTreeTokenController.test.js` | braintreeTokenController | braintree gateway |
| `brainTreePaymentController.test.js` | braintreePaymentController | braintree gateway, orderModel |
| `authMiddleware.test.js` | requireSignIn, isAdmin | JWT.verify, userModel.findById |
| `authHelper.test.js` | hashPassword, comparePassword | bcrypt.hash, bcrypt.compare |
| `productModel.test.js` | Product schema | None (real Mongoose validation) |
| `orderModel.test.js` | Order schema | None (real Mongoose validation) |

---

## 4. Integration Test Strategy & Approach

### 4.1 Approach: Bottom-Up Integration Testing

We use **bottom-up integration testing**:

1. **Level 0 (Already Done — MS1):** Individual units tested in isolation with full mocking.
2. **Level 1 (MS2 — Backend):** Controllers integrated with **real models + real database** (via `mongodb-memory-server`). Remove model mocks. Keep external services (Braintree) mocked.
3. **Level 2 (MS2 — Backend):** Routes integrated with **real middleware + real controllers + real DB** (via `supertest`). Remove middleware mocks. The full request pipeline is tested.
4. **Level 1 (MS2 — Frontend):** Pages integrated with **real context providers + real hooks**. Remove context/hook mocks. Keep axios mocked (since we don't want to run a server).
5. **Level 2 (MS2 — Frontend):** Multi-page flows where context state set by one component is consumed by another (e.g., Login sets auth → Header reflects it).

### 4.2 What "Integration" Means — vs Unit Tests

| Aspect | MS1 Unit Test | MS2 Integration Test |
|--------|--------------|---------------------|
| **Frontend Context** | Mocked (`jest.mock("../../context/auth")`) | **Real** AuthProvider/CartProvider/SearchProvider wrapping the component |
| **Frontend Hooks** | Mocked (`jest.mock("../../hooks/useCategory")`) | **Real** useCategory hook (axios still mocked) |
| **Frontend Multi-Component** | Single component in isolation | Multiple components rendered together (e.g., Header + SearchInput + CartBadge) |
| **Backend Models** | Mocked (`jest.mock("../models/userModel")`) | **Real** Mongoose models with in-memory MongoDB |
| **Backend Helpers** | Mocked (`jest.mock("../helpers/authHelper")`) | **Real** bcrypt hashing and comparison |
| **Backend Middleware** | Mocked or skipped | **Real** JWT verification + admin check in request pipeline |
| **Backend Routes** | Not tested | **Real** Express routes via `supertest` |
| **External Services** | Mocked | Still mocked (Braintree, etc.) |

### 4.3 Tools

| Tool | Purpose |
|------|---------|
| `jest` | Test runner |
| `@testing-library/react` | Frontend component rendering |
| `mongodb-memory-server` | In-memory MongoDB for backend integration tests |
| `supertest` | HTTP request testing against Express app |
| `@testing-library/user-event` | Simulate user interactions (clicks, typing) |

---

## 5. Frontend Integration Tests — Detailed Plan

### FE-INT-1: Login ↔ AuthContext ↔ Header

**Files Involved:**
- `pages/auth/Login.js` (form submission, sets auth)
- `context/auth.js` (AuthProvider stores user+token)
- `components/Header.js` (reads auth, shows dynamic nav)

**What Was Mocked in MS1 (Now Real):**
- `useAuth` context → **now real AuthProvider**
- localStorage → **now real localStorage**

**What Stays Mocked:**
- `axios` (API responses)

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Login success updates Header to show user dashboard | Render Login inside AuthProvider+CartProvider+SearchProvider+BrowserRouter. Mock `axios.post` to return `{success:true, user:{name:"John", role:0}, token:"xyz"}`. Fill form, submit. | Header shows "John" or dashboard link; login/register links disappear |
| 2 | Login stores auth in localStorage and AuthProvider reads it | Same as above. After login, check `localStorage.getItem("auth")`. | localStorage contains `{user, token}` JSON |
| 3 | Login sets axios default Authorization header | After login, check `axios.defaults.headers.common["Authorization"]`. | Header equals the token returned |
| 4 | Logout from Header clears auth and reverts nav | After login (as above), click logout in Header. | Auth context cleared, localStorage cleared, login/register links reappear |
| 5 | Login with admin user shows admin dashboard link | Mock login returns `role:1`. | Header shows link to `/dashboard/admin` |
| 6 | Login redirects to previous location | Set up location state with `from: "/cart"`. Login successfully. | navigate called with "/cart" |

---

### FE-INT-2: Register → Login Navigation

**Files Involved:**
- `pages/auth/Register.js` (form, navigates to /login on success)
- `pages/auth/Login.js` (destination page)

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Successful registration navigates to login page | Render App with all providers + MemoryRouter at `/register`. Mock register API success. Fill form, submit. | URL changes to `/login`, Login page renders |

---

### FE-INT-3: SearchInput ↔ SearchContext ↔ Search Page

**Files Involved:**
- `components/Form/SearchInput.js` (calls API, sets search context)
- `context/search.js` (SearchProvider stores keyword+results)
- `pages/Search.js` (reads search context, displays results)

**What Was Mocked in MS1 (Now Real):**
- `useSearch` context → **now real SearchProvider**

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Search flow: type keyword → results appear on Search page | Render SearchInput + Search page in SearchProvider. Mock `axios.get(/search/laptop)` → return products. Type "laptop", submit. | Search page shows products from API response |
| 2 | Empty search results | Mock API returns `[]`. Submit search. | Search page shows "No Products Found" |

---

### FE-INT-4: HomePage ↔ CartContext ↔ CartPage

**Files Involved:**
- `pages/HomePage.js` (product listing, "Add to Cart" buttons)
- `context/cart.js` (CartProvider)
- `pages/CartPage.js` (displays cart, total price, remove items)

**What Was Mocked in MS1 (Now Real):**
- `useCart` context → **now real CartProvider**

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Add to cart from HomePage, verify in CartPage | Render HomePage in all providers. Mock product list API. Click "Add to Cart" on a product. Navigate to CartPage. | CartPage shows the added product, correct price |
| 2 | Cart persists in localStorage | Add item to cart. Check localStorage. | `localStorage.getItem("cart")` contains the product |
| 3 | Remove item from CartPage updates context | Add 2 items. Navigate to CartPage. Remove one. | Only 1 item remains. Total price updated. |
| 4 | Cart total calculation with multiple items | Add multiple products with different prices. | CartPage shows correct sum |

---

### FE-INT-5: ProductDetails ↔ CartContext

**Files Involved:**
- `pages/ProductDetails.js` (product details + related products + add to cart)
- `context/cart.js` (CartProvider)

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Add to cart from ProductDetails page | Render ProductDetails with real CartProvider. Mock product API. Click "Add to Cart". | Cart context updated, toast shown, localStorage updated |
| 2 | Related products rendered and navigable | Mock related products API. Check rendered related product cards. | Related products displayed, "More Details" button navigates to new product slug |

---

### FE-INT-6: Categories ↔ useCategory Hook

**Files Involved:**
- `pages/Categories.js` (renders category list)
- `hooks/useCategory.js` (fetches categories via axios)

**What Was Mocked in MS1 (Now Real):**
- `useCategory` hook → **now real hook** (axios still mocked)

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Categories page renders from real useCategory hook | Render Categories with real useCategory. Mock `axios.get(/get-category)` → return categories. | Category links rendered with correct names and `/category/:slug` hrefs |
| 2 | Categories page handles API error | Mock axios to reject. | Page renders without crashing, no categories shown |

---

### FE-INT-7: Header ↔ useCategory ↔ AuthContext ↔ CartContext

**Files Involved:**
- `components/Header.js` (navigation bar)
- `hooks/useCategory.js` (category dropdown data)
- `context/auth.js` (controls login/logout display)
- `context/cart.js` (cart badge count)

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Header renders category dropdown from real hook | Render Header with all real providers. Mock category API. | Dropdown contains category names as links |
| 2 | Header cart badge reflects cart count | Pre-set cart context with 3 items. | Badge shows "3" |
| 3 | Header shows admin dashboard for admin user | Set auth context with `role: 1`. | Dashboard link points to `/dashboard/admin` |
| 4 | Header shows user dashboard for regular user | Set auth context with `role: 0`. | Dashboard link points to `/dashboard/user` |

---

### FE-INT-8: PrivateRoute ↔ AuthContext ↔ Spinner

**Files Involved:**
- `components/Routes/Private.js` (checks user auth)
- `context/auth.js` (provides token)
- `components/Spinner.js` (redirect with countdown)

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Authenticated user passes PrivateRoute | Set auth token in context. Mock `GET /user-auth` → `{ok:true}`. Render PrivateRoute with Outlet child. | Child route renders |
| 2 | Unauthenticated user sees Spinner redirect | No auth token. Mock API → `{ok:false}`. | Spinner renders with countdown, redirects to `/login` |

---

### FE-INT-9: AdminRoute ↔ AuthContext ↔ Spinner

**Files Involved:**
- `components/Routes/AdminRoute.js` (checks admin auth)
- `context/auth.js` (provides token)
- `components/Spinner.js` (redirect)

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Admin user passes AdminRoute | Set admin auth. Mock `GET /admin-auth` → `{ok:true}`. | Admin child route renders |
| 2 | Non-admin user gets Spinner redirect | Set regular user auth. Mock API → error. | Spinner renders, redirects |

---

### FE-INT-10: CreateCategory ↔ CategoryForm (Real Child Component)

**Files Involved:**
- `pages/admin/CreateCategory.js` (parent — handles API + state)
- `components/Form/CategoryForm.js` (child — form input + submit button)

**What Was Mocked in MS1 (Now Real):**
- CategoryForm was tested in isolation. Now tested as **real child** of CreateCategory.

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Create new category via CategoryForm | Render CreateCategory. Mock get-category, create-category APIs. Type name in CategoryForm input, submit. | API called with correct name, category list refreshed |
| 2 | Edit category via Modal + CategoryForm | Mock existing categories. Click edit button. Update name in Modal's CategoryForm. Submit. | update API called, list refreshed with new name |
| 3 | Delete category | Click delete. | delete API called, category removed from list |

---

### FE-INT-11: Profile ↔ AuthContext

**Files Involved:**
- `pages/user/Profile.js` (reads auth context, updates profile)
- `context/auth.js` (provides user data, updates on profile save)

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Profile form pre-populated from auth context | Set auth with user data. Render Profile with real AuthProvider. | Form fields show user's name, email, phone, address |
| 2 | Profile update syncs back to auth context + localStorage | Change name, submit. Mock API success. | Auth context has updated name. localStorage updated. |

---

### FE-INT-12: Orders (User) ↔ AuthContext

**Files Involved:**
- `pages/user/Orders.js` (fetches user's orders)
- `context/auth.js` (provides auth token for API call)

**Test Cases:**

| # | Test Case | Steps | Assertions |
|---|-----------|-------|------------|
| 1 | Orders fetched and displayed for authenticated user | Set auth token. Mock orders API. Render Orders with real AuthProvider. | Order table renders with correct product details |

---

## 6. Backend Integration Tests — Detailed Plan

### BE-INT-1: Auth Controller ↔ User Model ↔ Auth Helper (Real DB)

**Files Involved:**
- `controllers/authController.js` — registerController, loginController, forgotPasswordController
- `models/userModel.js` — real Mongoose model
- `helpers/authHelper.js` — real bcrypt hashing

**What Was Mocked in MS1 (Now Real):**
- `userModel` → **real model with mongodb-memory-server**
- `hashPassword`, `comparePassword` → **real bcrypt**

**What Stays Mocked:**
- Nothing (except `process.env.JWT_SECRET` is set in test env)

**Test Cases:**

| # | Test Case | Integration Point | Assertions |
|---|-----------|------------------|------------|
| 1 | Register creates user in real DB with hashed password | `registerController` → `userModel.save()` → `hashPassword` (bcrypt) | User exists in DB, password is bcrypt hash (not plaintext) |
| 2 | Register rejects duplicate email | `registerController` → `userModel.findOne` | Returns "Already Registered" for same email |
| 3 | Login with valid credentials after registration | `registerController` → `loginController` → `comparePassword` (bcrypt) → `JWT.sign` | Returns success:true, valid JWT token |
| 4 | Login with wrong password after registration | Register → Login with wrong password | `comparePassword` returns false, response: "Invalid Password" |
| 5 | Forgot password resets and allows new login | Register → forgotPassword → Login with new password | New password works, old password fails |
| 6 | Login with non-existent email | Login with unregistered email | Returns "Email is not registered" |

---

### BE-INT-2: Auth Route ↔ Middleware ↔ Controller (Full Pipeline via Supertest)

**Files Involved:**
- `routes/authRoute.js` — route definitions
- `middlewares/authMiddleware.js` — requireSignIn, isAdmin
- `controllers/authController.js` — all controllers
- `models/userModel.js`, `models/orderModel.js` — real models
- `helpers/authHelper.js` — real bcrypt

**Test Cases:**

| # | Test Case | HTTP Request | Integration Point | Assertions |
|---|-----------|-------------|-------------------|------------|
| 1 | Full register → login → access protected route | `POST /register` → `POST /login` → `GET /test` with token | Route → middleware(requireSignIn+isAdmin) → controller | Register 201, Login 200 with token, Test 200 with success |
| 2 | Protected route rejects no token | `GET /api/v1/auth/orders` without Authorization header | Route → requireSignIn rejects | 401 "Invalid or expired token" |
| 3 | Admin route rejects regular user | Register regular user → Login → `GET /api/v1/auth/all-orders` | Route → requireSignIn passes → isAdmin rejects (role=0) | 401 "UnAuthorized Access" |
| 4 | Profile update via full pipeline | Register → Login → `PUT /api/v1/auth/profile` with new name | Route → requireSignIn → updateProfileController → userModel.findByIdAndUpdate | 200, updated name in response and DB |
| 5 | Expired/tampered token rejected | `GET /api/v1/auth/user-auth` with bad token | Route → requireSignIn | 401 |

---

### BE-INT-3: Category Controller ↔ Category Model (Real DB)

**Files Involved:**
- `controllers/categoryController.js` — all CRUD controllers
- `models/categoryModel.js` — real model

**Test Cases:**

| # | Test Case | Integration Point | Assertions |
|---|-----------|------------------|------------|
| 1 | Create category saves to DB with auto-slug | `createCategoryController` → `categoryModel.save()` → `slugify` | Category in DB with correct name and slug |
| 2 | Duplicate category name rejected | Create same name twice | Second create returns "Category already exists" |
| 3 | Get all categories returns created ones | Create 3 categories → `categoryController` | Returns array of 3 categories |
| 4 | Get single category by slug | Create category → `singleCategoryController` with its slug | Returns correct category |
| 5 | Update category name + slug | Create → Update with new name | DB reflects new name and new slug |
| 6 | Update rejects duplicate name | Create "A" and "B" → Update "B" to "A" | Returns "Category name already exists" |
| 7 | Delete category removes from DB | Create → Delete → Get all | Deleted category not in list |
| 8 | Delete non-existent category | Delete with random ObjectId | Returns 404 "Category id not found" |

---

### BE-INT-4: Product Controller ↔ Product Model ↔ Category Model (Real DB)

**Files Involved:**
- `controllers/productController.js` — all product controllers
- `models/productModel.js` — real model
- `models/categoryModel.js` — real model (for category references + productCategoryController)

**Test Cases:**

| # | Test Case | Integration Point | Assertions |
|---|-----------|------------------|------------|
| 1 | Create product with valid category reference | Create category → createProductController with category's ID | Product saved in DB with correct category ObjectId, slug generated |
| 2 | Get all products with populated category | Create category + products → `getProductController` | Products returned with category name populated |
| 3 | Get single product by slug | Create product → `getSingleProductController` | Correct product returned with populated category |
| 4 | Delete product removes from DB | Create → Delete → Get single | 404 product not found |
| 5 | Update product changes DB record | Create → Update name/price → Get single | Updated values in response |
| 6 | Duplicate product name rejected on create | Create "Widget" → Create "Widget" again | Returns 409 "Product with this name already exists" |
| 7 | Filter by category | Create 2 categories, products in each → Filter by category A | Only category A products returned |
| 8 | Filter by price range | Create products at $10, $50, $100 → Filter [20, 60] | Only $50 product returned |
| 9 | Search by keyword in name | Create product "Blue Widget" → Search "blue" | Product returned (case-insensitive regex) |
| 10 | Search by keyword in description | Create product with desc "amazing gadget" → Search "gadget" | Product returned |
| 11 | Related products (same category, exclude self) | Create 4 products in same category → Get related for one | Returns up to 3 other products in same category |
| 12 | Products by category slug | Create category + products → `productCategoryController` with slug | Returns category object + its products |
| 13 | Pagination (6 per page) | Create 8 products → Get page 1, page 2 | Page 1: 6 products, Page 2: 2 products |
| 14 | Product count | Create 5 products → `productCountController` | Total = 5 |

---

### BE-INT-5: Order Flow — Controller ↔ Order Model ↔ User Model ↔ Product Model (Real DB)

**Files Involved:**
- `controllers/authController.js` — getOrdersController, getAllOrdersController, orderStatusController
- `models/orderModel.js` — real model
- `models/userModel.js` — for buyer population
- `models/productModel.js` — for product population

**Test Cases:**

| # | Test Case | Integration Point | Assertions |
|---|-----------|------------------|------------|
| 1 | Get user orders with populated products + buyer | Create user + products + order → `getOrdersController` | Orders returned with product details and buyer name |
| 2 | Get all orders sorted by createdAt desc | Create multiple orders → `getAllOrdersController` | Orders in descending time order |
| 3 | Update order status | Create order → `orderStatusController("Processing")` | Order status updated in DB |
| 4 | Update order with invalid status | `orderStatusController("InvalidStatus")` | 400 with validation error |
| 5 | Update non-existent order | Random ObjectId → `orderStatusController` | 404 "Order not found" |
| 6 | Only user's own orders returned | Create 2 users with different orders → `getOrdersController` for user A | Only user A's orders returned |

---

### BE-INT-6: Category Route ↔ Middleware ↔ Controller (Full Pipeline via Supertest)

**Files Involved:**
- `routes/categoryRoutes.js`
- `middlewares/authMiddleware.js`
- `controllers/categoryController.js`
- `models/categoryModel.js`

**Test Cases:**

| # | Test Case | HTTP Request | Assertions |
|---|-----------|-------------|------------|
| 1 | Admin creates category via API | Register admin → Login → `POST /api/v1/category/create-category` | 201, category in response |
| 2 | Non-admin cannot create category | Register regular user → Login → `POST /create-category` | 401 Unauthorized |
| 3 | Public can get all categories | `GET /api/v1/category/get-category` (no auth) | 200, categories list |
| 4 | Public can get single category | `GET /api/v1/category/single-category/:slug` (no auth) | 200, category object |
| 5 | Admin updates category | Login admin → `PUT /update-category/:id` | 200, updated category |
| 6 | Admin deletes category | Login admin → `DELETE /delete-category/:id` | 200, success |

---

### BE-INT-7: Product Route ↔ Middleware ↔ Controller (Full Pipeline via Supertest)

**Files Involved:**
- `routes/productRoutes.js`
- `middlewares/authMiddleware.js`
- `controllers/productController.js`
- `models/productModel.js`, `models/categoryModel.js`

**Test Cases:**

| # | Test Case | HTTP Request | Assertions |
|---|-----------|-------------|------------|
| 1 | Admin creates product via multipart form | Admin login → `POST /create-product` with formidable fields | 201, product in response |
| 2 | Public gets product list | `GET /api/v1/product/get-product` (no auth) | 200, products array |
| 3 | Public searches products | `GET /api/v1/product/search/laptop` | 200, matching products |
| 4 | Public gets product by category | `GET /api/v1/product/product-category/:slug` | 200, category + products |
| 5 | Authenticated user makes payment | Login → `POST /braintree/payment` | 200, order created (Braintree mocked) |

---

## 7. Component Dependency Graph

```
                          ┌──────────────────────────────────────────────┐
                          │                   App.js                     │
                          │          (Routes → all pages)                │
                          └──────────┬───────────────────┬───────────────┘
                                     │                   │
                    ┌────────────────┴──┐           ┌────┴────────────┐
                    │  PrivateRoute     │           │   AdminRoute    │
                    │  (requireSignIn)  │           │ (requireSignIn  │
                    │     ↕ AuthContext  │           │  + isAdmin)     │
                    │     ↕ Spinner      │           │  ↕ AuthContext  │
                    └────────┬──────────┘           │  ↕ Spinner      │
                             │                      └────┬────────────┘
              ┌──────────────┼──────────────┐            │
              │              │              │      ┌─────┼──────────────────┐
         Dashboard      Orders(User)    Profile   │     │                  │
         ↕AuthCtx       ↕AuthCtx       ↕AuthCtx  CreateCategory    CreateProduct
         ↕UserMenu      ↕UserMenu      ↕UserMenu  ↕CategoryForm    ↕AdminMenu
         ↕Layout        ↕Layout        ↕Layout    ↕AdminMenu       ↕Layout
                                                   ↕Layout          │
                                                                    │
    ┌────────────┐   ┌────────────────┐   ┌──────────────────┐   ┌─┴──────────┐
    │  HomePage  │   │ ProductDetails │   │ CategoryProduct  │   │  Products  │
    │ ↕CartCtx   │   │ ↕CartCtx       │   │ ↕CartCtx         │   │ ↕AdminMenu │
    │ ↕Layout    │   │ ↕Layout        │   │ ↕Layout          │   │ ↕Layout    │
    └────────────┘   └────────────────┘   └──────────────────┘   └────────────┘
                                                    │
                          ┌─────────────────────────┘
                          │
    ┌──────────┐   ┌──────┴─────┐   ┌──────────────┐   ┌─────────────┐
    │  Login   │   │ Categories │   │    Search     │   │  CartPage   │
    │ ↕AuthCtx │   │ ↕useCategory│  │ ↕SearchCtx   │   │ ↕CartCtx    │
    │ ↕Layout  │   │ ↕Layout    │   │ ↕Layout      │   │ ↕AuthCtx    │
    └──────────┘   └────────────┘   └──────────────┘   │ ↕Layout     │
                                                        └─────────────┘
    SHARED COMPONENTS:
    ┌────────────────────────────────────────────────────────────────────┐
    │  Layout  →  Header  →  SearchInput (↕SearchCtx)                  │
    │                     →  useCategory hook                           │
    │                     →  AuthCtx (login/logout/dashboard display)   │
    │                     →  CartCtx (badge count)                      │
    │           →  Footer                                               │
    │           →  Helmet + Toaster                                     │
    └────────────────────────────────────────────────────────────────────┘


    BACKEND DEPENDENCY CHAIN:
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  Route (authRoute / categoryRoutes / productRoutes)                    │
    │    → Middleware (requireSignIn → JWT.verify)                           │
    │    → Middleware (isAdmin → userModel.findById → check role)            │
    │    → Controller                                                        │
    │        → Model (Mongoose) → MongoDB                                    │
    │        → Helper (hashPassword / comparePassword → bcrypt)              │
    │        → External (slugify, braintree, fs)                             │
    └─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Suggested Member Allocation

Based on MS1 ownership and cross-cutting integration opportunities:

| Member | MS1 Scope | MS2 Integration Tests | Files Touched |
|--------|-----------|----------------------|---------------|
| **Kim Shi Tong (A0265858J)** | Auth & Registration | FE-INT-1 (Login↔AuthContext↔Header), FE-INT-2 (Register→Login), FE-INT-8 (PrivateRoute↔Auth↔Spinner), BE-INT-1 (Auth Controller↔Model↔Helper), BE-INT-2 (Auth Route full pipeline) | Login.js, Register.js, auth.js context, Header.js, Private.js, Spinner.js, authController.js, authMiddleware.js, authHelper.js, userModel.js |
| **Yan Weidong (A0258151H)** | Orders & Payments | FE-INT-4 (HomePage↔Cart↔CartPage), FE-INT-11 (Profile↔AuthContext), FE-INT-12 (Orders↔AuthContext), BE-INT-5 (Order flow — Controller↔OrderModel↔UserModel↔ProductModel) | HomePage.js, CartPage.js, cart.js context, Profile.js, Orders.js (user), authController.js (order functions), orderModel.js |
| **Bertrand (A0253013X)** | Products | FE-INT-5 (ProductDetails↔Cart), FE-INT-3 (SearchInput↔SearchContext↔Search), BE-INT-4 (Product Controller↔ProductModel↔CategoryModel), BE-INT-7 (Product Route pipeline) | ProductDetails.js, SearchInput.js, Search.js, search.js context, productController.js, productModel.js, categoryModel.js |
| **Shaun (A0252626E)** | Categories | FE-INT-6 (Categories↔useCategory), FE-INT-7 (Header↔useCategory↔Auth↔Cart), FE-INT-9 (AdminRoute↔Auth↔Spinner), FE-INT-10 (CreateCategory↔CategoryForm), BE-INT-3 (Category Controller↔Model), BE-INT-6 (Category Route pipeline) | Categories.js, useCategory.js, Header.js, AdminRoute.js, CreateCategory.js, CategoryForm.js, categoryController.js, categoryModel.js |

---

## Appendix: Quick Reference — All Integration Test IDs

### Frontend
| ID | Name | Components Integrated |
|----|------|----------------------|
| FE-INT-1 | Login ↔ Auth ↔ Header | Login.js + auth.js context + Header.js |
| FE-INT-2 | Register → Login | Register.js + Login.js (navigation) |
| FE-INT-3 | Search Flow | SearchInput.js + search.js context + Search.js |
| FE-INT-4 | Cart Flow | HomePage.js + cart.js context + CartPage.js |
| FE-INT-5 | Product + Cart | ProductDetails.js + cart.js context |
| FE-INT-6 | Categories + Hook | Categories.js + useCategory.js hook |
| FE-INT-7 | Header Multi-Integration | Header.js + useCategory + auth.js + cart.js |
| FE-INT-8 | Private Route | Private.js + auth.js + Spinner.js |
| FE-INT-9 | Admin Route | AdminRoute.js + auth.js + Spinner.js |
| FE-INT-10 | Create Category + Form | CreateCategory.js + CategoryForm.js |
| FE-INT-11 | Profile + Auth | Profile.js + auth.js context |
| FE-INT-12 | User Orders + Auth | Orders.js (user) + auth.js context |

### Backend
| ID | Name | Components Integrated |
|----|------|----------------------|
| BE-INT-1 | Auth Controller + DB | authController.js + userModel + authHelper (real bcrypt) |
| BE-INT-2 | Auth Route Pipeline | authRoute.js + authMiddleware.js + authController.js + models |
| BE-INT-3 | Category Controller + DB | categoryController.js + categoryModel (real DB) |
| BE-INT-4 | Product Controller + DB | productController.js + productModel + categoryModel (real DB) |
| BE-INT-5 | Order Flow + DB | authController.js (orders) + orderModel + userModel + productModel |
| BE-INT-6 | Category Route Pipeline | categoryRoutes.js + authMiddleware.js + categoryController.js + categoryModel |
| BE-INT-7 | Product Route Pipeline | productRoutes.js + authMiddleware.js + productController.js + productModel |
