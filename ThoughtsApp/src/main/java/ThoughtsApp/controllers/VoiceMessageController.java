package ThoughtsApp.controllers;

import ThoughtsApp.models.ListenedMessage;
import ThoughtsApp.models.ListenedMessageDto;
import ThoughtsApp.models.VoiceMessage;
import ThoughtsApp.properties.AwsProperties;
import ThoughtsApp.services.ListenedMessageService;
import ThoughtsApp.services.VoiceMessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ThoughtsApp.services.S3Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/voice")
public class VoiceMessageController {

    private final S3Service s3Service;

    private final ListenedMessageService listenedMessageService;
    private final AwsProperties awsProperties;

    private final VoiceMessageService voiceMessageService;


    private final S3Client s3Client;


    public VoiceMessageController(S3Service s3Service, ListenedMessageService listenedMessageService, AwsProperties awsProperties, VoiceMessageService voiceMessageService, S3Client s3Client) {
        this.s3Service = s3Service;
        this.listenedMessageService = listenedMessageService;
        this.awsProperties = awsProperties;
        this.voiceMessageService = voiceMessageService;
        this.s3Client = s3Client;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadVoice(
            @RequestParam("file") MultipartFile file,
            @RequestParam("user_id") String userId) throws IOException {
        String s3Key = s3Service.uploadFile(file, userId);
        return ResponseEntity.ok(s3Key);
    }

    @GetMapping("/check-last-hour-audio")
    public ResponseEntity<Boolean> checkUserAudioLastHour(@RequestParam String userId) {
        String currentDate = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        String prefix = "users/" + currentDate + "/" + userId + "/";

        ListObjectsV2Request request = ListObjectsV2Request.builder()
                .bucket(awsProperties.getBucketName())
                .prefix(prefix)
                .build();

        ListObjectsV2Response result = s3Client.listObjectsV2(request);

        Instant oneHourAgo = Instant.now().minus(Duration.ofHours(1));

        boolean exists = result.contents().stream()
                .map(S3Object::lastModified)
                .anyMatch(lastModified -> lastModified.isAfter(oneHourAgo));

        return ResponseEntity.ok(exists);
    }

    @PostMapping("/listened")
    public ResponseEntity<ListenedMessage> logMessageListen(@RequestBody ListenedMessageDto dto) {
        ListenedMessage saved = listenedMessageService.logMessageListen(
                dto.getListenerUserId(),
                dto.getMessageOwnerUserId(),
                dto.getMessageId(),
                dto.getListenedDate()
        );
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/next-audio")
    public ResponseEntity<?> getNextAudio(@RequestParam UUID userId) {
        LocalDate today = LocalDate.now();

        // Step 1: Get all voice messages posted today by other users
        List<VoiceMessage> todaysMessages = voiceMessageService.getTodaysMessagesExcludingUser(userId, today);

        if (todaysMessages.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .body("No messages available from other users today.");
        }

        // Step 2: Get IDs of messages the user has already listened to
        List<UUID> listenedMessageIds = listenedMessageService.getListenedMessageIds(userId, today);

        // Step 3: Filter out already listened messages
        List<VoiceMessage> unlistenedMessages = todaysMessages.stream()
                .filter(msg -> !listenedMessageIds.contains(msg.getId()))
                .toList();

        if (unlistenedMessages.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .body("You have listened to all messages for today.");
        }

        // Step 4: Pick one at random
        VoiceMessage selectedMessage = unlistenedMessages.get(new Random().nextInt(unlistenedMessages.size()));

        // Step 5: Log it as listened
        listenedMessageService.logMessageListen(userId, UUID.fromString(selectedMessage.getUser().getId().toString()), selectedMessage.getId(), today);

        // Step 6: Return the audio info
        String fullUrl = String.format("https://%s.s3.%s.amazonaws.com/%s",
                awsProperties.getBucketName(),
                awsProperties.getRegion(),
                selectedMessage.getS3Key());

        Map<String, Object> result = new HashMap<>();
        result.put("audioUrl", fullUrl);
        result.put("userId", selectedMessage.getUser().getId());
        result.put("messageId", selectedMessage.getId());

        return ResponseEntity.ok(result);
    }
}