package com.group_2.onlineshop.dto;

public class CartItemDTO {
    private Long productId;
    private String productName;
    private double productPrice;
    private Double productSalePrice;
    private int quantity;

    // Getters and Setters
    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public double getProductPrice() {
        return productPrice;
    }

    public void setProductPrice(double productPrice) {
        this.productPrice = productPrice;
    }

    public Double getProductSalePrice() {
        return productSalePrice;
    }

    public void setProductSalePrice(Double productSalePrice) {
        this.productSalePrice = productSalePrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}