package com.group_2.onlineshop.repository;

import com.group_2.onlineshop.entity.Order;
import com.group_2.onlineshop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
}