package ThoughtsApp.services;

import ThoughtsApp.models.User;
import ThoughtsApp.models.VoiceMessage;
import ThoughtsApp.properties.AwsProperties;
import ThoughtsApp.repository.UserRepository;
import ThoughtsApp.repository.VoiceMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;


@Service
public class S3Service {

    private final S3Client s3Client;
    private final AwsProperties awsProperties;
    private final UserRepository userRepository;


    private final VoiceMessageRepository voiceMessageRepository;

    public S3Service(S3Client s3Client,
                     AwsProperties awsProperties,
                     UserRepository userRepository,
                     VoiceMessageRepository voiceMessageRepository) {
        this.s3Client = s3Client;
        this.awsProperties = awsProperties;
        this.userRepository = userRepository;
        this.voiceMessageRepository = voiceMessageRepository;
    }


    public String uploadFile(MultipartFile file, String userId) throws IOException {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate UUID once and reuse for DB + S3
        UUID messageId = UUID.randomUUID();

        // Current date (e.g. 2025-09-23)
        String currentDate = LocalDate.now().toString();

        // Build S3 key: users/{date}/{userId}/{uuid}_{originalFilename}
        String key = "users/" + currentDate + "/" + userId + "/"
                + messageId + "_" + file.getOriginalFilename();

        // Build entity with same UUID + S3 key
        VoiceMessage voiceMessage = VoiceMessage.builder()
                .id(messageId)
                .user(user)
                .s3Key(key)
                .createdAt(LocalDateTime.now())
                .active(true)
                .build();

        // Save in DB
        voiceMessageRepository.save(voiceMessage);

        // Upload to S3 (SDK v2 style)
        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(awsProperties.getBucketName())
                            .key(key)
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload to S3", e);
        }

        // Return the S3 URL
        return String.format("https://%s.s3.%s.amazonaws.com/%s",
                awsProperties.getBucketName(),
                awsProperties.getRegion(),
                key);
    }

    // Helper to safely extract file extension
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    public String uploadUserPost(String userId, MultipartFile file) throws IOException {
        String postId = UUID.randomUUID().toString();
        String key = String.format("users/%s/posts/%s_%s", userId, postId, file.getOriginalFilename());

        s3Client.putObject(builder -> builder
                        .bucket(awsProperties.getBucketName())
                        .key(key)
                        .build(),
                RequestBody.fromBytes(file.getBytes()));

        return String.format("✅ Post image uploaded successfully for user %s with postId %s", userId, postId);
    }
}