<?php
require_once "../../config/db.php";

requireAuth();

$data = getJsonInput();

$userId = $_SESSION["user"]["id"];
$cartItemId = $data["cart_item_id"] ?? null;
$quantity = $data["quantity"] ?? null;

if (!$cartItemId || !$quantity || $quantity < 1) {
    response(false, "Передайте id позиции корзины и количество");
}

$stmt = $pdo->prepare("
    UPDATE cart_items
    SET quantity = ?
    WHERE id = ? AND user_id = ?
");

$stmt->execute([$quantity, $cartItemId, $userId]);

response(true, "Количество обновлено");