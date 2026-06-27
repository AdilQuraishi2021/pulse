# Issue 2: Query Performance

## Findings

The feed, profile post list, and bookmarks services had an N+1 query pattern. After loading posts, each post triggered separate queries for like count, comment count, and viewer like status.

For a 10-post authenticated page load, the old query counts were:

- Home feed: 32 queries. One following lookup, one post lookup, then three metric queries per post.
- Profile page: 37 queries. Five profile header queries, then one user lookup, one post lookup, and three metric queries per post.
- Bookmarks page: 41 queries. One bookmark lookup, then one post lookup and three metric queries per bookmarked post.

## Fix

- Added `getPostMetrics` in `apps/api/src/services/post-metrics.ts` to batch post metrics by post ID.
- Updated post lists, home/explore feeds, user posts, and bookmarked posts to fetch metrics in constant queries.
- Updated bookmarked posts to load post details with the paginated bookmark query instead of querying each post separately.
- Updated profile header loading to compute follower, following, post count, and follow status with scalar subqueries in the user lookup.

## After Counts

- Home feed with 10 posts: 5 queries.
- Profile page with 10 posts: 6 queries.
- Bookmarks page with 10 posts: 4 queries.

`apps/api/src/services/query-performance.test.ts` locks these counts so future changes do not reintroduce the N+1 pattern.
