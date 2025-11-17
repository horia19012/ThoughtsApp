package ThoughtsApp.services;

import ThoughtsApp.models.LoginRequest;
import ThoughtsApp.models.User;
import ThoughtsApp.repository.UserRepository;
import ThoughtsApp.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final JwtUtil jwtUtil;

    @Autowired
    public AuthenticationService(UserRepository usersRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = usersRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public String authenticate(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElse(null);
        if (user == null) {
            return null;
        }
        if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return jwtUtil.generateToken(user.getUsername());
        }
        return null;
    }
}