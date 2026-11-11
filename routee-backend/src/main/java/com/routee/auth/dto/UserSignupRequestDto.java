package com.routee.auth.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserSignupRequestDto {
    private String username;
    private String password;
    private String email;
}
