"use strict";
const header = document.querySelector("[data-header]");
const goTopBtn = document.querySelector("[data-go-top]");
const navToggleBtn = document.querySelector("[data-nav-toggle-btn]");
const navbar = document.querySelector("[data-navbar]");
const themeToggleBtn = document.querySelector("[data-theme-btn]");
let lastScrollY = window.scrollY;
let isScrollingDown = false;
const toggleClass = (el, cls) => el.classList.toggle(cls);
const setTheme = (theme) => {
document.body.classList.remove("dark_theme", "light_theme");
document.body.classList.add(theme);
localStorage.setItem("theme", theme);
};
window.addEventListener("scroll", () => {
const currentScrollY = window.scrollY;
if (currentScrollY > lastScrollY && currentScrollY > 100) {
if (!isScrollingDown) {
header.classList.add("hidden");
isScrollingDown = true;
}
} else if (currentScrollY < lastScrollY) {
if (isScrollingDown) {
header.classList.remove("hidden");
isScrollingDown = false;
}
}
if (currentScrollY >= 10) {
header.classList.add("active");
goTopBtn.classList.add("active");
} else {
header.classList.remove("active", "hidden");
goTopBtn.classList.remove("active");
isScrollingDown = false;
}
lastScrollY = currentScrollY;
});
navToggleBtn.addEventListener("click", () => {
toggleClass(navToggleBtn, "active");
toggleClass(navbar, "active");
toggleClass(document.body, "active");
});
themeToggleBtn.addEventListener("click", () => {
toggleClass(themeToggleBtn, "active");
if (themeToggleBtn.classList.contains("active")) {
setTheme("light_theme");
} else {
setTheme("dark_theme");
}
});
const userTheme = localStorage.getItem("theme");
if (userTheme === "light_theme") {
toggleClass(themeToggleBtn, "active");
setTheme("light_theme");
} else {
setTheme("dark_theme");
}
const POSTS_URL = "./posts.json";
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");
const loadingEl = document.getElementById("post-loading");
const errorEl = document.getElementById("post-error");
const wrapperEl = document.getElementById("post-wrapper");
async function loadPost() {
if (!postId) {
showError();
return;
}
try {
const res = await fetch(POSTS_URL);
if (!res.ok) {
throw new Error("Failed to fetch posts");
}
const posts = await res.json();
const post = posts.find((p) => p.id === postId);
if (!post) {
throw new Error("Post not found");
}
const others = posts.filter((p) => p.id !== postId).slice(0, 3);
renderPost(post, others);
} catch (err) {
console.error("Could not load post:", err);
showError();
}
}
function showError() {
loadingEl.style.display = "none";
errorEl.classList.add("visible");
}
function renderPost(post, others) {
document.title = `${post.title} | Beexoul Blog`;
document.getElementById("post-category").textContent = post.category || "";
document.getElementById("post-date").textContent = post.date || "";
document.getElementById("post-read-time").textContent = post.readTime || "";
document.getElementById("post-title").textContent = post.title || "";
document.getElementById("post-subtitle").textContent = post.subtitle || "";
const author = post.author || "Beexoul";
document.getElementById("author-name").textContent = author;
document.getElementById("author-avatar-letter").textContent = author.charAt(0).toUpperCase();
const cover = document.getElementById("post-cover-img");
cover.src = post.thumbnail || "";
cover.alt = post.title || "Blog post cover";
const body = document.getElementById("post-body");
const contentBlocks = Array.isArray(post.content) ? post.content : [];
body.innerHTML = contentBlocks.map((block) => renderBlock(block)).join("");
const tagsList = document.getElementById("post-tags-list");
const tags = Array.isArray(post.tags) ? post.tags : [];
tagsList.innerHTML = tags.map((tag) => `<li class="tag">${escapeHtml(tag)}</li>`).join("");
if (others.length) {
const grid = document.getElementById("more-posts-grid");
grid.innerHTML = others
.map(
(p) => `
<a href="post.html?id=${encodeURIComponent(p.id)}" class="more-post-card">
<div class="thumb">
<img src="${escapeAttribute(p.thumbnail)}" alt="${escapeAttribute(p.title)}" loading="lazy">
</div>
<div class="info">
<p class="cat">${escapeHtml(p.category || "")}</p>
<p class="title">${escapeHtml(p.title || "")}</p>
</div>
</a>
`
)
.join("");
} else {
document.querySelector(".more-posts").style.display = "none";
}
loadingEl.style.display = "none";
wrapperEl.classList.remove("hidden");
attachCopyHandlers();
}
function renderBlock(block) {
if (!block || typeof block !== "object") {
return "";
}
switch (block.type) {
case "paragraph":
return `<p>${escapeHtml(block.text || "")}</p>`;
case "heading":
return `<h2>${escapeHtml(block.text || "")}</h2>`;
case "code":
return `
<div class="code-block">
<div class="code-header">
<span class="code-lang">${escapeHtml(block.language || "code")}</span>
<button class="copy-btn" data-code="${encodeURIComponent(block.text || "")}">Copy</button>
</div>
<pre><code>${escapeHtml(block.text || "")}</code></pre>
</div>
`;
default:
return "";
}
}
function attachCopyHandlers() {
document.querySelectorAll(".copy-btn").forEach((btn) => {
btn.addEventListener("click", async () => {
const code = decodeURIComponent(btn.dataset.code || "");
try {
await navigator.clipboard.writeText(code);
btn.textContent = "Copied!";
btn.classList.add("copied");
setTimeout(() => {
btn.textContent = "Copy";
btn.classList.remove("copied");
}, 2000);
} catch {
btn.textContent = "Failed";
setTimeout(() => {
btn.textContent = "Copy";
}, 2000);
}
});
});
}
function escapeHtml(value) {
return String(value)
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;");
}
function escapeAttribute(value) {
return escapeHtml(value).replace(/'/g, "&#39;");
}
loadPost();