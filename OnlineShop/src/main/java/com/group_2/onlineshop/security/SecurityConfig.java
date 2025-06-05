package com.group_2.onlineshop.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    @Lazy
    private JwtRequestFilter jwtRequestFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                        .requestMatchers("api/auth/user/info").authenticated()
                        .requestMatchers("api/auth/update").authenticated()
                        .requestMatchers("/api/auth/users", "/api/orders/*/status").hasRole("ADMIN")
                        .requestMatchers("api/orders/*/cancel").authenticated()
                        .requestMatchers("api/orders/create").authenticated()
                        .requestMatchers("api/orders/user").authenticated()
                        .requestMatchers("/api/auth/change-password").authenticated()
                        .requestMatchers(HttpMethod.POST,"api/categories").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,"api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,"api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST,"api/products").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT,"api/products/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE,"api/products/**").hasRole("ADMIN")
                        .requestMatchers("api/cart/*").authenticated()
                        .anyRequest().permitAll()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}