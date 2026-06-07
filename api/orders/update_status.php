<?php
require_once "../../config/db.php";

requireAdmin();

$data = getJsonInput();

$orderId = $data["order_id"] ?? null;
$status = $data["status"] ?? "";

$allowedStatuses = [
    "Новый",
    "В обработке",
    "Отправлен",
    "Доставлен",
    "Отменён"
];

if (!$orderId || !in_array($status, $allowedStatuses)) {
    response(false, "Некорректный статус заказа");
}

$stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
$stmt->execute([$status, $orderId]);

response(true, "Статус заказа обновлён");