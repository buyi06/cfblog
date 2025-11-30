import assert from 'node:assert/strict';
import { getPosts } from '../functions/[[path]].js';

function createEnvFixture() {
  const store = new Map();
  const blog = {
    async get(key, type) {
      if (!store.has(key)) return null;
      const value = store.get(key);
      if (type === 'json') {
        try {
          return JSON.parse(value);
        } catch (err) {
          throw new Error(`Failed to parse JSON for key ${key}: ${err.message}`);
        }
      }
      return value;
    },
    async put(key, value) {
      store.set(key, value);
    },
    async delete(key) {
      store.delete(key);
    }
  };

  const env = { BLOG: blog };
  return { env, store };
}

function seedPosts(store) {
  const indexKey = 'idx:post:time';
  const posts = [
    { id: 'p1', title: 'Pinned Post', status: 'published', createdAt: 1000, pinned: true },
    { id: 'p2', title: 'Draft Post', status: 'draft', createdAt: 2000, pinned: false },
    { id: 'p3', title: 'Latest Post', status: 'published', createdAt: 3000, pinned: false }
  ];

  store.set(indexKey, JSON.stringify(posts.map(p => p.id)));
  posts.forEach(post => {
    store.set(`post:id:${post.id}`, JSON.stringify(post));
  });
}

(async function runTests() {
  const { env, store } = createEnvFixture();
  seedPosts(store);

  // 默认分页：仅返回已发布的文章，置顶靠前，分页正确
  const pageOne = await getPosts(env, { page: 1, limit: 2 });
  assert.equal(pageOne.total, 2, 'should exclude drafts from totals');
  assert.equal(pageOne.posts.length, 2, 'should paginate published posts');
  assert.equal(pageOne.posts[0].id, 'p1', 'pinned post should come first');
  assert.equal(pageOne.posts[1].id, 'p3', 'latest published post follows');
  assert.equal(pageOne.totalPages, 1, 'two published posts with limit 2 yields one page');

  // all=true 返回包括草稿在内的完整列表，并保持排序
  const adminList = await getPosts(env, { all: true });
  assert.equal(adminList.total, 3, 'all mode should include drafts');
  assert.equal(adminList.posts.length, 3, 'all posts should be returned');
  assert.equal(adminList.posts[2].id, 'p2', 'draft should be last by createdAt');

  // 非法分页参数应被安全兜底
  const safePaging = await getPosts(env, { page: -5, limit: 0 });
  assert.equal(safePaging.posts.length, 2, 'fallback limit should paginate first page');
  assert.equal(safePaging.totalPages, 1, 'fallback pagination should still compute pages');

  console.log('All getPosts tests passed');
})();
