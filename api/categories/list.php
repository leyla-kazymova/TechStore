<?php
require_once "../../config/db.php";

$stmt = $pdo->query("SELECT * FROM categories ORDER BY id DESC");
$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

response(true, "Список категорий", $categories);