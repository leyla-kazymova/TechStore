<?php
require_once "../../config/db.php";

requireAdmin();

$categoryId = $_POST["category_id"] ?? null;
$name = trim($_POST["name"] ?? "");
$description = trim($_POST["description"] ?? "");
$price = $_POST["price"] ?? null;
$quantity = $_POST["quantity"] ?? 0;
$price = floatval($_POST["price"] ?? 0);
$quantity = intval($_POST["quantity"] ?? 0);

if ($price <= 0) {
    response(false, "Некорректная цена");
}
if ($quantity < 0) {
    response(false, "Некорректное количество");
}

if (!$categoryId || $name === "" || !$price) {
    response(false, "Заполните обязательные поля");
}

if (isset($_FILES["image"]) && $_FILES["image"]["error"] === 0) {
    // Разрешённые типы
    $allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    $fileType = mime_content_type($_FILES["image"]["tmp_name"]);

    if (!in_array($fileType, $allowedTypes)) {
        response(false, "Разрешены только изображения JPG, PNG, WEBP");
    }

    // Ограничение размера — 5 МБ
    if ($_FILES["image"]["size"] > 5 * 1024 * 1024) {
        response(false, "Файл слишком большой. Максимум 5 МБ");
    }

    $extension = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
    $imageName = uniqid() . "." . strtolower($extension);
    move_uploaded_file($_FILES["image"]["tmp_name"], "../../uploads/" . $imageName);
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