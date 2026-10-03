import { createBrowserRouter } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { HomePage } from "./pages/Home";
import { NotFoundPage, RouteErrorPage } from "./pages/NotFound";
import { OrdersPage } from "./pages/Orders";
import { ProductDetailsPage } from "./pages/ProductDetails";
import { ShopPage } from "./pages/Shop";
import { OrderConfirmedPage } from "./pages/OrderConfirmed";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        errorElement: <RouteErrorPage />,
        children: [
            { index: true, element: <HomePage /> },
            { path: "shop", element: <ShopPage /> },
            { path: "products/:slug", element: <ProductDetailsPage /> },
            { path: "cart", element: <CartPage /> },
            { path: "checkout", element: <CheckoutPage /> },
            { path: "order-confirmed/:reference", element: <OrderConfirmedPage /> },
            { path: "orders", element: <OrdersPage /> },
            { path: "*", element: <NotFoundPage /> },
        ],
    },
]);
