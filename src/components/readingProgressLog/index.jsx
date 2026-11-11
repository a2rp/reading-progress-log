import { useEffect, useMemo, useState } from "react";
import { FiBookOpen, FiCheck, FiPlus, FiTrash2 } from "react-icons/fi";
import ConfirmDialog from "../confirmDialog";
import styles from "./styles.module.css";

const STORAGE_KEY = "page-pine-books";
const SHELVES = ["All books", "Reading", "Want to read", "Finished"];
const VALID_STATUSES = new Set(SHELVES.slice(1));
const VALID_COVER_COLORS = new Set(["rust", "sage", "blue", "new"]);

const sampleBooks = [
    {
        id: "a",
        title: "The Creative Act",
        author: "Rick Rubin",
        current: 142,
        total: 416,
        color: "rust",
        status: "Reading",
    },
    {
        id: "b",
        title: "Braiding Sweetgrass",
        author: "Robin Wall Kimmerer",
        current: 86,
        total: 384,
        color: "sage",
        status: "Reading",
    },
    {
        id: "c",
        title: "A Field Guide to Getting Lost",
        author: "Rebecca Solnit",
        current: 0,
        total: 224,
        color: "blue",
        status: "Want to read",
    },
];

function loadBooks() {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (!saved) return sampleBooks;

        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return sampleBooks;

        return parsed
            .filter((book) => {
                const total = Number(book?.total);
                return (
                    book &&
                    typeof book.id === "string" &&
                    typeof book.title === "string" &&
                    book.title.trim() &&
                    typeof book.author === "string" &&
                    Number.isFinite(total) &&
                    total > 0
                );
            })
            .map((book) => {
                const total = Number(book.total);
                const current = Math.min(total, Math.max(0, Number(book.current) || 0));

                return {
                    ...book,
                    current,
                    total,
                    color: VALID_COVER_COLORS.has(book.color) ? book.color : "new",
                    status: VALID_STATUSES.has(book.status) ? book.status : "Want to read",
                };
            });
    } catch {
        return sampleBooks;
    }
}

function createBookId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `book-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getProgress(book) {
    return Math.min(100, Math.round((book.current / book.total) * 100));
}

const ReadingProgressLog = () => {
    const [books, setBooks] = useState(loadBooks);
    const [filter, setFilter] = useState("All books");
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [total, setTotal] = useState("");
    const [pending, setPending] = useState(null);

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
        } catch {
            // Keep the reading session usable when browser storage is unavailable.
        }
    }, [books]);

    const visibleBooks = useMemo(
        () => books.filter((book) => filter === "All books" || book.status === filter),
        [books, filter],
    );
    const pagesRead = books.reduce((sum, book) => sum + book.current, 0);
    const finishedBooks = books.filter((book) => book.status === "Finished").length;
    const sectionTitle = filter === "All books" ? "Your books" : filter;

    const addBook = (event) => {
        event.preventDefault();
        const bookTitle = title.trim();
        const bookAuthor = author.trim();
        const pageCount = Number(total);

        if (!bookTitle || !bookAuthor || !Number.isFinite(pageCount) || pageCount < 1) return;

        setBooks((items) => [
            {
                id: createBookId(),
                title: bookTitle,
                author: bookAuthor,
                total: pageCount,
                current: 0,
                color: "new",
                status: "Want to read",
            },
            ...items,
        ]);
        setTitle("");
        setAuthor("");
        setTotal("");
    };

    const logPages = (bookId) => {
        setBooks((items) =>
            items.map((book) => {
                if (book.id !== bookId) return book;

                const current = Math.min(book.total, book.current + 10);
                return {
                    ...book,
                    current,
                    status: current >= book.total ? "Finished" : "Reading",
                };
            }),
        );
    };

    const removeBook = (bookId) => {
        setBooks((items) => items.filter((book) => book.id !== bookId));
        setPending(null);
    };

    return (
        <section className={styles.readingProgressLog} id="dashboard">
            <header className={styles.heading}>
                <div>
                    <p className={styles.label}>A PERSONAL READING LOG</p>
                    <h1>One more chapter.</h1>
                    <p>Keep your place and enjoy the pace you set for yourself.</p>
                </div>
                <div className={styles.monthNote}>
                    <span>THIS SEASON</span>
                    <b>{pagesRead.toLocaleString()}</b>
                    <small>pages read</small>
                </div>
            </header>

            <div className={styles.readingNow} id="workspace">
                <div className={styles.nowTitle}>
                    <span><FiBookOpen /></span>
                    <div>
                        <small>YOUR LIBRARY</small>
                        <h2>{sectionTitle}</h2>
                    </div>
                </div>

                <div className={styles.bookGrid}>
                    {visibleBooks.map((book) => {
                        const percent = getProgress(book);
                        const isFinished = book.status === "Finished" || percent >= 100;

                        return (
                            <article className={styles.bookCard} key={book.id}>
                                <div className={`${styles.bookCover} ${styles[book.color]}`} aria-hidden="true">
                                    <span>{book.title.split(" ").map((word) => word[0]).join("").slice(0, 3)}</span>
                                    <b>{book.title}</b>
                                    <small>{book.author}</small>
                                </div>

                                <div className={styles.bookInfo}>
                                    <div className={styles.bookTop}>
                                        <span>{book.status}</span>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${book.title}`}
                                            onClick={() => setPending(book)}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                    <h3>{book.title}</h3>
                                    <p>by {book.author}</p>
                                    <div
                                        className={styles.progress}
                                        role="progressbar"
                                        aria-label={`Reading progress for ${book.title}`}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={percent}
                                    >
                                        <span style={{ width: `${percent}%` }} />
                                    </div>
                                    <div className={styles.pageMeta}>
                                        <span>Page {book.current} of {book.total}</span>
                                        <b>{percent}%</b>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.logButton}
                                        disabled={isFinished}
                                        onClick={() => logPages(book.id)}
                                    >
                                        {isFinished ? <><FiCheck /> Finished</> : "Log 10 pages"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {!visibleBooks.length && (
                    <p className={styles.empty}>Nothing on this shelf yet. Add a title below.</p>
                )}
            </div>

            <div className={styles.shelf}>
                <div className={styles.shelfHead}>
                    <div>
                        <p className={styles.label}>LIBRARY CONTROLS</p>
                        <h2>Filter by shelf</h2>
                    </div>
                    <div className={styles.tabs} aria-label="Filter books by shelf">
                        {SHELVES.map((shelf) => (
                            <button
                                type="button"
                                key={shelf}
                                className={filter === shelf ? styles.active : ""}
                                aria-pressed={filter === shelf}
                                onClick={() => setFilter(shelf)}
                            >
                                {shelf}
                            </button>
                        ))}
                    </div>
                </div>
                <div className={styles.libraryLine}>
                    {books.length} titles <span>·</span> {finishedBooks} finished
                </div>
            </div>

            <form className={styles.addBook} onSubmit={addBook}>
                <strong>Add to the shelf</strong>
                <label>
                    Book title
                    <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" required />
                </label>
                <label>
                    Author
                    <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author" required />
                </label>
                <label>
                    Pages
                    <input type="number" min="1" value={total} onChange={(event) => setTotal(event.target.value)} placeholder="Total" required />
                </label>
                <button type="submit"><FiPlus /> Add book</button>
            </form>

            {pending && (
                <ConfirmDialog
                    title="Remove this book?"
                    description={`${pending.title} and its reading progress will be removed from this browser.`}
                    onCancel={() => setPending(null)}
                    onConfirm={() => removeBook(pending.id)}
                />
            )}
        </section>
    );
};

export default ReadingProgressLog;
