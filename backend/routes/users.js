// routes/users.js

const express = require("express");
const router = express.Router();
const UserStore = require("../stores/userStore");

// GET: ユーザー全件取得
router.get("/", async (req, res) => {
  try {
    const users = await UserStore.getAll();
    res.json(users);
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
    res.status(500).send("Server error");
  }
});
// POST: ユーザー新規登録
router.post("/", async (req, res) => {
  try {
    await UserStore.insert(req.body);
    res.status(201).send("User created");
  } catch (err) {
    console.error("❌ Failed to insert user:", err);
    res.status(500).send("Server error");
  }
});
// PUT: ユーザー情報更新
router.put("/:id", async (req, res) => {
  try {
    const user = {
      id: parseInt(req.params.id),
      name: req.body.name,
      is_admin: req.body.is_admin,
    };
    await UserStore.update(user);
    res.send("User updated");
  } catch (err) {
    console.error("❌ Failed to update user:", err);
    res.status(500).send("Server error");
  }
});
// DELETE: ユーザー削除
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await UserStore.delete(id);
    res.send("User deleted");
  } catch (err) {
    console.error("❌ Failed to delete user:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
