import { Outlet } from "react-router-dom";
import Header from "./Header/Header";
import styles from "./CheckoutLayout.module.css";
import Footer from "./Footer/Footer";

const CheckoutLayout = () => {
    return (
        <div className={styles.checkoutLayout}>
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutLayout;
