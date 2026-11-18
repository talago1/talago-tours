async function main() {
  const res = await fetch('https://albatrosfortours.com/wp-json/wp/v2/posts?per_page=10');
  const total = res.headers.get('x-wp-total');
  const totalPages = res.headers.get('x-wp-totalpages');
  console.log(`Total posts on Albatros: ${total} across ${totalPages} pages`);
  const posts = await res.json();
  posts.forEach(p => {
    console.log(`ID: ${p.id} | Slug: ${p.slug} | Title: ${p.title?.rendered} | Link: ${p.link}`);
  });
}
main();
