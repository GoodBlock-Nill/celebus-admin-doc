-- 2026-07-24: 하트 상점 판매 — 카탈로그에 heart 추가 (5 CP).
-- 구매/보유/소비는 기존 generic RPC(game_buy_item/consume/account)가 그대로 처리.
insert into game_item_catalog (item_type, price, sort) values ('heart', 5, 5)
on conflict (item_type) do update set price = 5, sort = 5;
