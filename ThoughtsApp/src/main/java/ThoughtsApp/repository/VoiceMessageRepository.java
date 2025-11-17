package ThoughtsApp.repository;

import ThoughtsApp.models.VoiceMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Repository
public interface VoiceMessageRepository extends JpaRepository<VoiceMessage, UUID> {

    List<VoiceMessage> findAllByUserIdNotAndCreatedAtBetween(UUID userId, LocalDateTime start, LocalDateTime end);
}
