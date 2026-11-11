package com.routee.auth.service;

import com.routee.auth.dto.UserLoginRequestDto;
import com.routee.auth.dto.UserLoginResponseDto;
import com.routee.auth.dto.UserSignupRequestDto;
import com.routee.auth.entity.Provider;
import com.routee.auth.entity.Role;
import com.routee.auth.entity.User;
import com.routee.auth.repository.UserRepository;
import com.routee.auth.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public void signup(UserSignupRequestDto requestDto){
        if(userRepository.existsByUsername(requestDto.getUsername())){
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }
        if(userRepository.existsByEmail(requestDto.getEmail())){
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        String encodedPassword = passwordEncoder.encode(requestDto.getPassword());

        User user = User.builder()
                .username(requestDto.getUsername())
                .password(encodedPassword)
                .email(requestDto.getEmail())
                .provider(Provider.LOCAL)
                .build();

        userRepository.save(user);
    }

    public UserLoginResponseDto login(UserLoginRequestDto requestDto) {
        User user = userRepository.findByUsername(requestDto.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치한지 않습니다.");
        }

        String token = jwtUtil.createToken(user.getUsername(), user.getUserId());

        return UserLoginResponseDto.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .token(token)
                .build();
    }
}
