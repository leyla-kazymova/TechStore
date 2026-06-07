<?php
require_once "../../config/db.php";

requireAdmin();

$id = $_POST["id"] ?? null;
$categoryId = $_POST["category_id"] ?? null;
$name = trim($_POST["name"] ?? "");
$description = trim($_POST["description"] ?? "");
$price = $_POST["price"] ?? null;
$quantity = $_POST["quantity"] ?? 0;

if (!$id || !$categoryId || $name === "" || !$price) {
    response(false, "Заполните обязательные поля");
}

$stmt = $pdo->prepare("SELECT image FROM products WHERE id = ?");
$stmt->execute([$id]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$product) {
    response(false, "Товар не найден");
}

$imageName = $product["image"];

if (isset($_FILES["image"]) && $_FILES["image"]["error"] === 0) {
    $extension = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
    $imageName = uniqid() . "." . $extension;
    move_uploaded_file($_FILES["image"]["tmp_name"], "../../uploads/" . $imageName);
}

$stmt = $pdo->prepare("
    UPDATE products
    SET category_id = ?, name = ?, description = ?, price = ?, image = ?, quantity = ?
    WHERE id = ?
");

$stmt->execute([
    $categoryId,
    $name,
    $description,
    $price,
    $imageName,
    $quantity,
    $id
]);

response(true, "Товар обновлён");