"use strict";
const header       = document.querySelector("[data-header]");
const goTopBtn     = document.querySelector("[data-go-top]");
const navToggleBtn = document.querySelector("[data-nav-toggle-btn]");
const navbar       = document.querySelector("[data-navbar]");
const themeBtn     = document.querySelector("[data-theme-btn]");
let lastScrollY = window.scrollY;
let isScrollingDown = false;
const toggleClass = (el, cls) => el.classList.toggle(cls);
const setTheme = (theme) => {
document.body.classList.remove("dark_theme", "light_theme");
document.body.classList.add(theme);
localStorage.setItem("theme", theme);
};
window.addEventListener("scroll", () => {
const cur = window.scrollY;
if (cur > lastScrollY && cur > 100) {
if (!isScrollingDown) { header.classList.add("hidden"); isScrollingDown = true; }
} else if (cur < lastScrollY) {
if (isScrollingDown) { header.classList.remove("hidden"); isScrollingDown = false; }
}
if (cur >= 10) {
header.classList.add("active");
goTopBtn.classList.add("active");
} else {
header.classList.remove("active", "hidden");
goTopBtn.classList.remove("active");
isScrollingDown = false;
}
lastScrollY = cur;
});
navToggleBtn.addEventListener("click", () => {
toggleClass(navToggleBtn, "active");
toggleClass(navbar, "active");
toggleClass(document.body, "active");
});
themeBtn.addEventListener("click", () => {
toggleClass(themeBtn, "active");
themeBtn.classList.contains("active") ? setTheme("light_theme") : setTheme("dark_theme");
});
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light_theme") { toggleClass(themeBtn, "active"); setTheme("light_theme"); }
else { setTheme("dark_theme"); }
const POSTS_URL     = "./assets/post/posts.json";
let   allPosts      = [];
let   activeCategory = "All";
let   searchQuery   = "";
const searchInput  = document.getElementById("blog-search-input");
const clearBtn     = document.getElementById("search-clear-btn");
const resultsCount = document.getElementById("search-results-count");
const sectionLabel = document.getElementById("posts-section-label");
const featuredSection = document.getElementById("featured-section");
function debounce(fn, ms) {
let t;
return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
searchInput.addEventListener("input", debounce(() => {
searchQuery = searchInput.value.trim();
if (searchQuery.length > 0) {
clearBtn.classList.add("visible");
} else {
clearBtn.classList.remove("visible");
}
applyFilters();
}, 220));
clearBtn.addEventListener("click", () => {
searchInput.value = "";
searchQuery = "";
clearBtn.classList.remove("visible");
searchInput.focus();
applyFilters();
});
document.addEventListener("keydown", (e) => {
if (e.key === "Escape" && searchQuery) {
searchInput.value = "";
searchQuery = "";
clearBtn.classList.remove("visible");
applyFilters();
}
});
async function loadPosts() {
try {
const res = await fetch(POSTS_URL);
if (!res.ok) throw new Error("Failed to fetch posts");
allPosts = await res.json();
setupFilters(allPosts);
applyFilters();
} catch (err) {
console.error("Could not load posts:", err);
document.getElementById("posts-grid").innerHTML =
`<p style="color:var(--color-secondary);grid-column:1/-1;text-align:center;padding:40px 0;">
Failed to load posts. Please try again later.
</p>`;
}
}
function applyFilters() {
const q = searchQuery.toLowerCase();
let pool = activeCategory === "All"
? allPosts
: allPosts.filter(p => p.category === activeCategory);
if (q) {
pool = pool.filter(p =>
p.title.toLowerCase().includes(q) ||
p.excerpt.toLowerCase().includes(q) ||
p.category.toLowerCase().includes(q) ||
p.tags.some(t => t.toLowerCase().includes(q))
);
}
const isSearching = q.length > 0;
if (isSearching) {
featuredSection.style.display = "none";
sectionLabel.textContent = "Search Results";
renderGrid(pool);
showResultsCount(pool.length, q);
} else if (activeCategory === "All") {
featuredSection.style.display = "";
sectionLabel.textContent = "Latest Posts";
renderFeatured(allPosts[0]);
renderGrid(allPosts.slice(1));
hideResultsCount();
} else {
featuredSection.style.display = "none";
sectionLabel.textContent = "Latest Posts";
renderGrid(pool);
hideResultsCount();
}
}
function renderFeatured(post) {
if (!post) return;
const el = document.getElementById("featured-card");
el.href = `./assets/post/post.html?id=${post.id}`;
el.innerHTML = `
<div class="card-img">
<img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
</div>
<div class="card-body">
<div class="card-meta">
<span class="card-category">${post.category}</span>
<span class="card-date">${post.date}</span>
<span class="card-read-time">· ${post.readTime}</span>
</div>
<h2 class="card-title">${post.title}</h2>
<p class="card-excerpt">${post.excerpt}</p>
<span class="read-link">Read Article <span class="arrow">→</span></span>
</div>
`;
}
function renderGrid(posts) {
const grid = document.getElementById("posts-grid");
const noResults = document.getElementById("no-results");
const noResultsMsg = document.getElementById("no-results-msg");
if (!posts.length) {
grid.innerHTML = "";
noResults.classList.add("visible");
noResultsMsg.textContent = searchQuery
? `No articles matched "${searchQuery}". Try a different keyword.`
: "No posts found in this category yet.";
return;
}
noResults.classList.remove("visible");
const q = searchQuery.toLowerCase();
grid.innerHTML = posts.map(post => `
<a href="./assets/post/post.html?id=${post.id}" class="post-card">
<div class="card-img">
<img src="${post.thumbnail}" alt="${post.title}" loading="lazy">
</div>
<div class="card-body">
<div class="card-meta">
<span class="card-category">${post.category}</span>
<span class="card-date">${post.date}</span>
</div>
<h3 class="card-title">${q ? highlight(post.title, q) : escapeHtml(post.title)}</h3>
<p class="card-excerpt">${q ? highlight(post.excerpt, q) : escapeHtml(post.excerpt)}</p>
<div class="card-tags">
${post.tags.slice(0, 3).map(t =>
`<span class="tag">${q ? highlight(t, q) : escapeHtml(t)}</span>`
).join("")}
</div>
</div>
</a>
`).join("");
}
function setupFilters(posts) {
const bar = document.getElementById("filter-bar");
const categories = ["All", ...new Set(posts.map(p => p.category))];
bar.innerHTML = categories.map(cat =>
`<button class="filter-btn${cat === "All" ? " active" : ""}" data-filter="${cat}">${cat}</button>`
).join("");
bar.addEventListener("click", (e) => {
const btn = e.target.closest(".filter-btn");
if (!btn) return;
bar.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
btn.classList.add("active");
activeCategory = btn.dataset.filter;
applyFilters();
});
}
function showResultsCount(count, query) {
resultsCount.hidden = false;
const safe = escapeHtml(query);
resultsCount.innerHTML = count === 0
? `No results for <strong>"${safe}"</strong>`
: `<strong>${count}</strong> result${count !== 1 ? "s" : ""} for <strong>"${safe}"</strong>`;
}
function hideResultsCount() { resultsCount.hidden = true; }
function highlight(text, query) {
const safe = escapeHtml(text);
const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
return safe.replace(re, `<mark class="search-highlight">$1</mark>`);
}
function escapeHtml(str) {
return String(str)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;");
}
loadPosts();