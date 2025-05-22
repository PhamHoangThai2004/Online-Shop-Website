package com.group_2.onlineshop.repository;

import com.group_2.onlineshop.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ImageRepository extends JpaRepository<Image, Long> {
}