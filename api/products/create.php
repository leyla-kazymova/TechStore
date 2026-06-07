<?php
require_once "../../config/db.php";

requireAdmin();

$categoryId = $_POST["category_id"] ?? null;
$name = trim($_POST["name"] ?? "");
$description = trim($_POST["description"] ?? "");
$price = $_POST["price"] ?? null;
$quantity = $_POST["quantity"] ?? 0;

if (!$categoryId || $name === "" || !$price) {
    response(false, "Заполните обязательные поля");
}

$imageName = null;

if (isset($_FILES["image"]) && $_FILES["image"]["error"] === 0) {
    $extension = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
    $imageName = uniqid() . "." . $extension;
    move_uploaded_file($_FILES["image"]["tmp_name"], "../../uploads/" . $imageName);
}

$stmt = $pdo->prepare("
    INSERT INTO products (category_id, name, description, price, image, quantity)
    VALUES (?, ?, ?, ?, ?, ?)
");

$stmt->execute([
    $categoryId,
    $name,
    $description,
    $price,
    $imageName,
    $quantity
]);

response(true, "Товар добавлен");