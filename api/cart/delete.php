<?php
require_once "../../config/db.php";

requireAuth();

$data = getJsonInput();

$userId = $_SESSION["user"]["id"];
$cartItemId = $data["cart_item_id"] ?? null;

if (!$cartItemId) {
    response(false, "Передайте id позиции корзины");
}

$stmt = $pdo->prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?");
$stmt->execute([$cartItemId, $userId]);

response(true, "Товар удалён из корзины");