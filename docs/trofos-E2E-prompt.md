docs. = """

# Comprehensive E2E (Playwright) Test Plan — Virtual Vault

## Overview

This document identifies **every E2E test scenario** organized by feature area. Each test is a **black-box, multi-component end-user flow** using Playwright. Tests navigate real pages, perform real user actions (click, type, select), and assert visible outcomes.

---

## Test File Structure

```
tests/e2e/
├── auth.spec.js              # Authentication flows
├── profile.spec.js           # User profile management
├── home.spec.js              # Home page browsing, filters, pagination
├── product-details.spec.js   # Product detail page + related products
├── categories.spec.js        # Category browsing (public)
├── search.spec.js            # Search functionality
├── cart.spec.js              # Cart management
├── checkout.spec.js          # Checkout & Braintree payment
├── user-orders.spec.js       # User order history
├── admin-categories.spec.js  # Admin category CRUD
├── admin-products.spec.js    # Admin product CRUD
├── admin-orders.spec.js      # Admin order management
├── navigation.spec.js        # Header, Footer, static pages, 404
└── route-protection.spec.js  # Protected route redirects
```

---

## 1. Authentication Flows — `auth.spec.js`

**Components involved:** `Register.js`, `Login.js`, `Header.js`, `Dashboard.js`, `AdminDashboard.js`, `Spinner.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 1.1 | **Register a new user successfully** | Navigate to `/register` → Fill in Name, Email, Password, Phone, Address, DOB, Favorite Sport → Click REGISTER | Toast "Register Successfully, please login" shown → Redirected to `/login` |
| 1.2 | **Register with missing required fields** | Navigate to `/register` → Leave Name blank → Fill other fields → Click REGISTER | Form validation prevents submission or error toast shown |
| 1.3 | **Register with duplicate email** | Navigate to `/register` → Fill in all fields using an already-registered email → Click REGISTER | Error toast with message about existing user |
| 1.4 | **Login successfully as regular user** | Navigate to `/login` → Enter valid email + password → Click LOGIN | Toast "login successfully" → Redirected to `/` → Header shows user's name in dropdown (not Register/Login links) |
| 1.5 | **Login successfully as admin** | Navigate to `/login` → Enter admin email + password → Click LOGIN | Toast "login successfully" → Header shows admin name → Dashboard link goes to `/dashboard/admin` |
| 1.6 | **Login with wrong password** | Navigate to `/login` → Enter valid email + wrong password → Click LOGIN | Error toast "Invalid Password" → Stays on `/login` |
| 1.7 | **Login with non-existent email** | Navigate to `/login` → Enter unregistered email → Click LOGIN | Error toast "Email is not registered" → Stays on `/login` |
| 1.8 | **Logout** | Login first → Click user name dropdown → Click Logout | Toast "Logout Successfully" → Header shows Register/Login links → Redirected to `/login` |
| 1.9 | **Register then immediately login** | Complete registration → On `/login`, use the same credentials → Click LOGIN | Successful login → Redirected to home → User name in header |
| 1.10 | **Login redirects back to intended page** | Visit `/dashboard/user` while logged out → Gets redirected to `/login` → Login → Should redirect back to `/dashboard/user` | After login, user is on `/dashboard/user`, not `/` |

---

## 2. User Profile Management — `profile.spec.js`

**Components involved:** `Profile.js`, `UserMenu.js`, `Dashboard.js`, `Header.js`, `Login.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 2.1 | **View user dashboard** | Login → Click Dashboard from dropdown | Dashboard shows user name, email, address |
| 2.2 | **Navigate to profile from dashboard** | Login → Go to dashboard → Click "Profile" in sidebar | Profile form loads with pre-filled name, email, phone, address; email field is disabled |
| 2.3 | **Update profile name** | Login → Navigate to profile → Change name → Click UPDATE | Toast "Profile Updated Successfully" → Header dropdown shows new name |
| 2.4 | **Update profile phone and address** | Login → Navigate to profile → Change phone + address → Click UPDATE | Toast "Profile Updated Successfully" → Navigating back to Dashboard shows updated address |
| 2.5 | **Update password** | Login → Navigate to profile → Enter new password → Click UPDATE | Toast success → Logout → Login with new password succeeds |
| 2.6 | **Email field is not editable** | Login → Navigate to profile | Email input field has `disabled` attribute, cannot be changed |

---

## 3. Home Page Browsing — `home.spec.js`

**Components involved:** `HomePage.js`, `Header.js`, `ProductDetails.js`, `CartPage.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 3.1 | **Home page loads products** | Navigate to `/` | Product cards are displayed with name, price, description, image |
| 3.2 | **Filter by category** | On home page → Check a category checkbox | Product list updates to show only products in that category |
| 3.3 | **Filter by price range** | On home page → Select a price radio (e.g., $20-39) | Product list updates to show only products within that price range |
| 3.4 | **Filter by category AND price** | On home page → Check a category → Select a price range | Product list shows only products matching both filters |
| 3.5 | **Reset filters** | Apply category + price filters → Click "Reset Filters" | Page reloads, all filters cleared, all products shown again |
| 3.6 | **Load more products (pagination)** | On home page with many products → Click "Loadmore" | Additional products appended below existing ones; button disappears when all loaded |
| 3.7 | **Click "More Details" on product card** | On home page → Click "More Details" on a product | Navigated to `/product/:slug` with correct product details |
| 3.8 | **Add to cart from home page** | On home page → Click "ADD TO CART" on a product | Toast "Item Added to cart" → Cart badge count in header increments by 1 |
| 3.9 | **Add multiple items to cart from home** | Click "ADD TO CART" on 3 different products | Cart badge shows 3 |

---

## 4. Product Details — `product-details.spec.js`

**Components involved:** `ProductDetails.js`, `HomePage.js`, `CartPage.js`, `Header.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 4.1 | **View product details** | From home → Click "More Details" on a product | Product page shows name, description, price, category, image |
| 4.2 | **Add to cart from product detail page** | On product detail → Click "ADD TO CART" | Toast "Item Added to cart" → Cart badge increments |
| 4.3 | **View similar/related products** | Navigate to a product that has related products | "Similar Products" section shows products in same category |
| 4.4 | **Navigate to a related product** | On product detail → Click "More Details" on a similar product | Page updates to show the new product's details (URL changes to new slug) |
| 4.5 | **Add related product to cart** | On product detail → Click "ADD TO CART" on a similar product | Toast "Item Added to cart" → Cart badge increments |
| 4.6 | **Product with no similar products** | Navigate to a product that is the only one in its category | Shows "No Similar Products found" message |

---

## 5. Category Browsing (Public) — `categories.spec.js`

**Components involved:** `Categories.js`, `CategoryProduct.js`, `Header.js`, `CartPage.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 5.1 | **View all categories page** | Navigate to `/categories` | All categories displayed as clickable buttons/links |
| 5.2 | **Click a category to see its products** | On `/categories` → Click a category | Navigated to `/category/:slug` → Shows category name, product count, and product cards |
| 5.3 | **Add to cart from category page** | On category product page → Click "ADD TO CART" | Toast shown → Cart badge increments |
| 5.4 | **Navigate to product detail from category page** | On category product page → Click "More Details" | Navigated to product detail page |
| 5.5 | **Categories dropdown in header** | Click "Categories" dropdown in header | Dropdown shows "All Categories" + every category; clicking one navigates to its product page |

---

## 6. Search Functionality — `search.spec.js`

**Components involved:** `SearchInput.js`, `Search.js`, `Header.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 6.1 | **Search for existing product** | Type product name in search bar → Click Search | Redirected to `/search` → Shows matching products with count |
| 6.2 | **Search with no results** | Type a nonsense keyword → Click Search | Redirected to `/search` → Shows "No Products Found" |
| 6.3 | **Search then search again** | Search for "shirt" → See results → Search for "phone" | Results update to show phone-related products |
| 6.4 | **Search from any page** | Navigate to `/about` → Type in search bar → Click Search | Redirected to `/search` with results |

---

## 7. Cart Management — `cart.spec.js`

**Components involved:** `CartPage.js`, `HomePage.js`, `ProductDetails.js`, `Header.js`, `Login.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 7.1 | **View empty cart** | Navigate to `/cart` (with empty cart) | Shows "Your Cart Is Empty" message |
| 7.2 | **Add item and view cart** | On home → ADD TO CART → Navigate to `/cart` | Cart shows the item with name, description, price; total price matches |
| 7.3 | **Add multiple items and verify total** | Add 3 items to cart → Go to `/cart` | All 3 items listed; total = sum of prices |
| 7.4 | **Remove item from cart** | Add 2 items → Go to `/cart` → Click Remove on one item | Item disappears; total updates; cart badge decrements |
| 7.5 | **Cart persists after page refresh** | Add items to cart → Refresh page (F5) | Cart items still present (loaded from localStorage) |
| 7.6 | **Cart shows guest greeting when not logged in** | Log out → Navigate to `/cart` with items | Shows "Hello Guest" and "please login to checkout !" |
| 7.7 | **Cart shows user greeting when logged in** | Log in → Navigate to `/cart` | Shows "Hello [name]" |
| 7.8 | **Click "Please Login to checkout"** | As guest with items in cart → Click login button | Redirected to `/login` → After login, redirected back to `/cart` |
| 7.9 | **Update address from cart page** | Login (user with no address) → Go to cart → Click "Update Address" | Redirected to `/dashboard/user/profile` |

---

## 8. Checkout & Payment — `checkout.spec.js`

**Components involved:** `CartPage.js`, `Login.js`, `Profile.js`, `Orders.js`, `Header.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 8.1 | **Complete purchase flow** | Login → Add items to cart → Go to cart → Braintree DropIn loads → Enter payment details → Click "Make Payment" | Toast success → Redirected to `/dashboard/user/orders` → Cart is empty (badge = 0) → Order appears in order list |
| 8.2 | **Payment button disabled without address** | Login (user with no address) → Add items → Go to cart | "Make Payment" button is disabled |
| 8.3 | **Payment section not shown when logged out** | Add items as guest → Go to cart | Braintree DropIn and payment button are NOT visible |
| 8.4 | **Payment section not shown with empty cart** | Login → Go to cart (empty) | Braintree DropIn is NOT visible |
| 8.5 | **Full E2E: Register → Login → Add to Cart → Checkout → View Order** | Register new user → Login → Update address in profile → Add product to cart → Complete payment → View order history | Order visible in orders page with correct product, status "Not Processed", payment "Success" |

---

## 9. User Order History — `user-orders.spec.js`

**Components involved:** `Orders.js`, `UserMenu.js`, `Dashboard.js`, `CartPage.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 9.1 | **View orders page with orders** | Login (user with past orders) → Navigate to `/dashboard/user/orders` | Orders displayed in table with status, buyer name, date, payment status, quantity |
| 9.2 | **View orders page with no orders** | Login (new user with no orders) → Navigate to `/dashboard/user/orders` | Empty orders page (no table rows or "no orders" message) |
| 9.3 | **Order shows product details** | Login → Navigate to orders | Each order row shows product image, name, description, price |
| 9.4 | **Navigate between dashboard tabs** | Login → Go to Dashboard → Click "Orders" → Click "Profile" → Click "Orders" | Each tab navigation works correctly, correct content shown |

---

## 10. Admin — Category CRUD — `admin-categories.spec.js`

**Components involved:** `CreateCategory.js`, `CategoryForm.js`, `AdminMenu.js`, `Header.js`, `Login.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 10.1 | **View existing categories** | Login as admin → Navigate to `/dashboard/admin/create-category` | Table lists all existing categories |
| 10.2 | **Create a new category** | Login as admin → Navigate to create-category → Type new name → Click Submit | Toast "[name] is created" → New category appears in table |
| 10.3 | **Create category with empty name** | Type blank/spaces → Click Submit | Error toast shown; no category created |
| 10.4 | **Edit a category** | Click Edit on a category → Modal opens → Change name → Click Submit in modal | Toast "[name] is updated" → Table shows updated name |
| 10.5 | **Edit category with duplicate name** | Click Edit → Enter a name that already exists → Submit | Error toast about duplicate name |
| 10.6 | **Delete a category** | Click Delete on a category | Toast with deleted name → Category removed from table |
| 10.7 | **Cancel edit modal** | Click Edit → Modal opens → Click X to close | Modal closes; category unchanged |
| 10.8 | **Full CRUD cycle** | Create "TestCat" → Verify in table → Edit to "TestCatUpdated" → Verify → Delete → Verify gone | Each step succeeds with correct toasts |

---

## 11. Admin — Product CRUD — `admin-products.spec.js`

**Components involved:** `Products.js`, `CreateProduct.js`, `UpdateProduct.js`, `AdminMenu.js`, `Header.js`, `Login.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 11.1 | **View product list** | Login as admin → Navigate to `/dashboard/admin/products` | All products displayed as cards with name, description, image |
| 11.2 | **Navigate from product list to update page** | On products list → Click a product card | Navigated to `/dashboard/admin/product/:slug` with form pre-filled |
| 11.3 | **Create a new product** | Navigate to create-product → Select category → Upload photo → Fill name, description, price, quantity → Select shipping → Click CREATE PRODUCT | Toast success → Redirected to `/dashboard/admin/products` → New product in list |
| 11.4 | **Create product with missing fields** | Fill only name → Click CREATE PRODUCT | Error toast or validation error |
| 11.5 | **Update product name and price** | Navigate to update page for a product → Change name + price → Click UPDATE PRODUCT | Toast success → Redirected to products → Updated product visible |
| 11.6 | **Update product photo** | On update page → Upload new photo → Click UPDATE PRODUCT | Image preview changes → After update, product shows new image |
| 11.7 | **Delete a product** | On update page → Click DELETE PRODUCT → Confirm dialog | Product deleted → Redirected to products → Product no longer in list |
| 11.8 | **Cancel delete product** | On update page → Click DELETE PRODUCT → Cancel in confirm dialog | Product NOT deleted; stays on update page |
| 11.9 | **Full product lifecycle** | Create product → View in list → Update details → View updated → Delete | Each step works correctly |

---

## 12. Admin — Order Management — `admin-orders.spec.js`

**Components involved:** `AdminOrders.js`, `AdminMenu.js`, `Header.js`, `Login.js`, `Orders.js` (user side)

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 12.1 | **View all orders** | Login as admin → Navigate to `/dashboard/admin/orders` | All orders from all users displayed with status, buyer, date, payment, quantity |
| 12.2 | **Update order status** | On admin orders → Change status dropdown of an order (e.g., "Not Processed" → "Shipped") | API call made → Order list refreshes → New status shown in dropdown |
| 12.3 | **Status change reflects on user side** | Admin changes order to "Shipped" → Logout → Login as the buyer → View user orders | Order shows "Shipped" status |
| 12.4 | **View order product details** | On admin orders page | Each order shows product image, name, description, price |

---

## 13. Navigation & Static Pages — `navigation.spec.js`

**Components involved:** `Header.js`, `Footer.js`, `About.js`, `Contact.js`, `Policy.js`, `Pagenotfound.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 13.1 | **Header brand link goes home** | Click "Virtual Vault" logo/brand in header | Navigated to `/` |
| 13.2 | **Header Home link** | Click "Home" in navbar | Navigated to `/` |
| 13.3 | **Footer About link** | Click "About" in footer | Navigated to `/about`; About page content visible |
| 13.4 | **Footer Contact link** | Click "Contact" in footer | Navigated to `/contact`; Contact info visible |
| 13.5 | **Footer Policy link** | Click "Privacy Policy" in footer | Navigated to `/policy`; Policy page visible |
| 13.6 | **404 page for invalid route** | Navigate to `/nonexistent-page` | 404 page shown with "Go Back" link |
| 13.7 | **404 Go Back button** | On 404 page → Click "Go Back" | Navigated to `/` (home) |
| 13.8 | **Cart badge updates** | Add item → Check header badge → Remove item → Check header badge | Badge increments and decrements correctly |
| 13.9 | **Categories dropdown in header** | Click Categories dropdown | Shows "All Categories" + dynamic category list |

---

## 14. Route Protection — `route-protection.spec.js`

**Components involved:** `Private.js`, `AdminRoute.js`, `Spinner.js`, `Login.js`

| # | Test Scenario | Steps | Assertions |
|---|---|---|---|
| 14.1 | **Unauthenticated user redirected from user dashboard** | Visit `/dashboard/user` while logged out | Spinner appears → Redirected to `/login` |
| 14.2 | **Unauthenticated user redirected from user orders** | Visit `/dashboard/user/orders` while logged out | Redirected to `/login` |
| 14.3 | **Unauthenticated user redirected from user profile** | Visit `/dashboard/user/profile` while logged out | Redirected to `/login` |
| 14.4 | **Unauthenticated user redirected from admin dashboard** | Visit `/dashboard/admin` while logged out | Redirected to `/login` |
| 14.5 | **Regular user cannot access admin dashboard** | Login as regular user → Visit `/dashboard/admin` | Redirected to login or unauthorized |
| 14.6 | **Regular user cannot access admin create-category** | Login as regular user → Visit `/dashboard/admin/create-category` | Redirected |
| 14.7 | **Regular user cannot access admin products** | Login as regular user → Visit `/dashboard/admin/products` | Redirected |
| 14.8 | **Admin can access admin dashboard** | Login as admin → Visit `/dashboard/admin` | Admin dashboard loads correctly |
| 14.9 | **Public pages accessible without login** | Visit `/`, `/categories`, `/about`, `/contact`, `/policy`, `/cart` | All load successfully without redirect |

---

## 15. Cross-Feature Multi-Component Flows (High-Value E2E)

These are the **highest-value** E2E tests that span many components:

| # | Flow | Components Touched |
|---|---|---|
| 15.1 | **Register → Login → Browse → Add to Cart → Checkout → View Order** | Register, Login, Header, HomePage, CartPage (Braintree), Orders |
| 15.2 | **Login → Search Product → View Details → Add to Cart → View Cart** | Login, Header/SearchInput, Search, ProductDetails, CartPage |
| 15.3 | **Login → Browse Category → View Product → Add to Cart → Remove from Cart** | Login, Header (Categories dropdown), CategoryProduct, ProductDetails, CartPage |
| 15.4 | **Admin: Login → Create Category → Create Product → View in Store** | Login, AdminDashboard, CreateCategory, CreateProduct, Products, HomePage |
| 15.5 | **Admin: Login → Update Product → Delete Product → Verify Removed** | Login, Products, UpdateProduct, HomePage |
| 15.6 | **Admin: Login → View Orders → Update Status → User Sees Updated Status** | Login (admin), AdminOrders, Login (user), UserOrders |
| 15.7 | **Login → Update Profile → Cart shows updated address → Checkout** | Login, Profile, CartPage |
| 15.8 | **Guest Browse → Add to Cart → Prompted to Login → Login → Cart Preserved → Checkout** | HomePage, CartPage, Login, CartPage (again), Orders |
| 15.9 | **Home filter by category + price → More Details → Related Products → Add to Cart** | HomePage, ProductDetails, CartPage |
| 15.10 | **Admin Full Category CRUD → Verify in Public Categories Page** | CreateCategory, Categories, CategoryProduct |

---

## Component-to-File Mapping (for test assertions)

| Component | Source File | Key Data-Testid / Selectors to Use |
|---|---|---|
| Register Form | `client/src/pages/auth/Register.js` | `input[type=text]`, `input[type=email]`, `button:text("REGISTER")` |
| Login Form | `client/src/pages/auth/Login.js` | `input[type=email]`, `input[type=password]`, `button:text("LOGIN")` |
| Header | `client/src/components/Header.js` | `.navbar`, `a:text("Home")`, `.nav-link`, `Badge` |
| Home Page | `client/src/pages/HomePage.js` | `.card`, `button:text("More Details")`, `button:text("ADD TO CART")`, `button:text("Loadmore")`, `button:text("Reset Filters")` |
| Cart Page | `client/src/pages/CartPage.js` | `button:text("Remove")`, `button:text("Make Payment")`, `.cart-summary` |
| Product Details | `client/src/pages/ProductDetails.js` | `.product-details`, `button:text("ADD TO CART")` |
| Categories | `client/src/pages/Categories.js` | `.category-link`, `a.btn` |
| Category Products | `client/src/pages/CategoryProduct.js` | `.card`, `button:text("More Details")` |
| Search | `client/src/pages/Search.js` | Search results cards |
| User Dashboard | `client/src/pages/user/Dashboard.js` | `.card`, user info display |
| User Profile | `client/src/pages/user/Profile.js` | `input[type=text]`, `button:text("UPDATE")` |
| User Orders | `client/src/pages/user/Orders.js` | `.table`, order rows |
| Admin Dashboard | `client/src/pages/admin/AdminDashboard.js` | `.card`, admin info display |
| Admin Categories | `client/src/pages/admin/CreateCategory.js` | `CategoryForm`, `.table`, `button:text("Edit")`, `button:text("Delete")`, `Modal` |
| Admin Products List | `client/src/pages/admin/Products.js` | `.card`, product links |
| Admin Create Product | `client/src/pages/admin/CreateProduct.js` | `Select`, file input, `button:text("CREATE PRODUCT")` |
| Admin Update Product | `client/src/pages/admin/UpdateProduct.js` | `Select`, file input, `button:text("UPDATE PRODUCT")`, `button:text("DELETE PRODUCT")` |
| Admin Orders | `client/src/pages/admin/AdminOrders.js` | `Select` (status dropdown), `.table` |
| Search Input | `client/src/components/Form/SearchInput.js` | `input[type=search]`, `button:text("Search")` |
| User Menu | `client/src/components/UserMenu.js` | `NavLink:text("Profile")`, `NavLink:text("Orders")` |
| Admin Menu | `client/src/components/AdminMenu.js` | `NavLink:text("Create Category")`, etc. |

---

## Total Test Count Summary

| Test File | # Scenarios |
|---|---|
| `auth.spec.js` | 10 |
| `profile.spec.js` | 6 |
| `home.spec.js` | 9 |
| `product-details.spec.js` | 6 |
| `categories.spec.js` | 5 |
| `search.spec.js` | 4 |
| `cart.spec.js` | 9 |
| `checkout.spec.js` | 5 |
| `user-orders.spec.js` | 4 |
| `admin-categories.spec.js` | 8 |
| `admin-products.spec.js` | 9 |
| `admin-orders.spec.js` | 4 |
| `navigation.spec.js` | 9 |
| `route-protection.spec.js` | 9 |
| **TOTAL** | **97 scenarios** |

---

## Work Division Suggestion (4 members)

| Member | Test Files | Approx Scenarios |
|---|---|---|
| **KIM SHI TONG** (Auth & Registration) | `auth.spec.js`, `profile.spec.js`, `route-protection.spec.js` | 25 |
"""

Produce Trofos/Jira like issue

criteria : 
You are to use TROFOS and create stories for all of the sprints. However, only Sprint 3 (1%) and Sprint 4 (1%) will be graded.
A sprint ends on Monday, 12:00 PM of the respective sprint review week.
Sprint criteria:

Stories are specific, doable, and with the right objectives based on your assigned task.
Your story should have a title (e.g., UI tests for Dashboard).
Your story should also have a description which describes in more detail exactly what you would be testing (e.g., which interactions of the dashboard you would be testing).
As a rule of thumb, a story should be minimally 4 hours or work (1 point on TROFOS = 4 hours of work).
Stories reflect right status at the beginning and end of each sprint (not started, in progress, completed, etc).
There are at least 5 stories.
Stories should be assigned to you and should have a deadline.
Stories were created by Thursday, 12:00 PM, of the respective sprint planning week.
 


Do stories for software testing KIM SHI TONG

StrictExample : do something like :
One story = """
 Title : [FE-INT-11] Profile + Auth
Description: Components Under Test:
- pages/user/Profile.js (reads auth context, updates profile)
- context/auth.js (provides user data, updates on profile save)

Proposed Test Cases:
1. Profile Updated with Current Logged-In User
Text Scenario: Profile form pre-populated from auth context
Assertion: Form fields show user's name, email, phone, address

2. Profile Changes Update Auth Context
Text Scenario: Profile update syncs back to auth context + localStorage
Assertion: Auth context has updated name. localStorage updated.
"""

One story = """
Title : [UI Test] Cart Management
Description : Proposed E2E Test Flow: 

1. View Empty Cart
Test Scenario: User navigates to /cart with no items added.
Assertion: The page displays the message “Your Cart Is Empty.”

2. Add Item and View Cart
Test Scenario: User adds one item to the cart and navigates to /cart.
Assertion: The cart displays the correct item name, description, and price. The total price matches the item price.

3. Add Multiple Items and Verify Total
Test Scenario: User adds three items to the cart and navigates to /cart.
Assertion: All three items are listed correctly. The total price equals the sum of the individual item prices.

4. Remove Item from Cart
Test Scenario: User adds two items to the cart and removes one from the /cart page.
Assertion: The removed item no longer appears in the cart. The total price updates correctly. The cart badge count decreases by one.

5. Cart Persists After Page Refresh
Test Scenario: User adds items to the cart and refreshes the page.
Assertion: The cart items remain present after refresh and are correctly loaded from local storage.

6. Guest Greeting in Cart
Test Scenario: Logged-out user navigates to /cart with items in the cart.
Assertion: The page displays “Hello Guest” and the message “please login to checkout !”

7. Logged-in User Greeting
Test Scenario: Logged-in user navigates to /cart.
Assertion: The page displays “Hello [User Name]” with the correct logged-in name.

8. Login Redirect Flow from Cart
Test Scenario: Guest user with items in cart clicks the login button from /cart.
Assertion: User is redirected to /login. After successful login, user is redirected back to /cart.

9. Update Address from Cart
Test Scenario: Logged-in user without a saved address clicks “Update Address” from the cart page.
Assertion: User is redirected to /dashboard/user/profile.
"""
strictly follow the docs and allocate story for Kim Shi Tong

It should have three story| **KIM SHI TONG** (Auth & Registration) | `auth.spec.js`, `profile.spec.js`, `route-protection.spec.js` | 25 |
for each of them so like[UI Test] Cart Management


Project Team 10-34
1
YW
UM
[UI Test] Checkout & Payment

Project Team 10-35
1
YW
UP
[UI Test] Order History

Project Team 10-36
