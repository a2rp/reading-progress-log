import { useEffect, useState } from "react";
import styles from "./App.module.css";
import SiteHeader from "./components/siteHeader";
import SiteFooter from "./components/siteFooter";
import BackToTop from "./components/backToTop";
import ReadingProgressLog from "./components/readingProgressLog";

const App = () => {
    const [showBackToTop, setShowBackToTop] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowBackToTop(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (
        <div className={styles["app-shell"]} id="top">
            <SiteHeader title="Page & Pine" mark="P" navItems={[["Reading now", "#dashboard"], ["Bookshelf", "#workspace"]]} repoUrl="https://github.com/a2rp/reading-progress-log" />
            <main className={styles.pageContent}>
                <ReadingProgressLog />
            </main>
            <SiteFooter repoUrl="https://github.com/a2rp/reading-progress-log" />
            <BackToTop visible={showBackToTop} />
        </div>
    );
};

export default App;
