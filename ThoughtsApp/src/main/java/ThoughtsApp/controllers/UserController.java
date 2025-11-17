package ThoughtsApp.controllers;

import ThoughtsApp.models.User;
import ThoughtsApp.properties.AwsProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ThoughtsApp.services.UserService;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final S3Client s3Client;
    private final AwsProperties awsProperties;
    public UserController(UserService userService, S3Client s3Client, AwsProperties awsProperties) {
        this.userService = userService;
        this.s3Client = s3Client;
        this.awsProperties = awsProperties;
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable UUID id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/today-users")
    public Set<String> getUsersForToday(@RequestParam String currentUserId) {
        String currentDate = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        String prefix = "users/" + currentDate + "/";

        ListObjectsV2Request request = ListObjectsV2Request.builder()
                .bucket(awsProperties.getBucketName())
                .prefix(prefix)
                .build();

        ListObjectsV2Response result = s3Client.listObjectsV2(request);

        Set<String> users = new HashSet<>();

        for (S3Object obj : result.contents()) {
            // Extract userId from key: users/{date}/{userId}/file
            String key = obj.key();
            String[] parts = key.split("/");
            if (parts.length >= 3) {
                String userId = parts[2];
                if (!userId.equals(currentUserId)) {
                    users.add(userId);
                }
            }
        }

        return users;
    }
}