package com.routee.auth.service;

import com.routee.auth.entity.Provider;
import com.routee.auth.entity.User;
import com.routee.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String)attributes.get("email");
        String name = (String)attributes.get("name");

        User user = userRepository.findByEmail(email)
                .map(existingUser -> userRepository.save(existingUser))
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .username(name)
                            .provider(Provider.GOOGLE)
                            .build();
                    return userRepository.save(newUser);
                });

        return oAuth2User;
    }
}
