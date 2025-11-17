package ThoughtsApp.services;

import ThoughtsApp.models.VoiceMessage;
import ThoughtsApp.repository.VoiceMessageRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class VoiceMessageService {

    private final VoiceMessageRepository voiceMessageRepository;

    public VoiceMessageService(VoiceMessageRepository voiceMessageRepository) {
        this.voiceMessageRepository = voiceMessageRepository;
    }

    public List<VoiceMessage> getTodaysMessagesExcludingUser(UUID userId, LocalDate date) {
        LocalDate start = date;
        LocalDate end = date.plusDays(1);
        return voiceMessageRepository.findAllByUserIdNotAndCreatedAtBetween(
                userId,
                start.atStartOfDay(),
                end.atStartOfDay()
        );
    }
}