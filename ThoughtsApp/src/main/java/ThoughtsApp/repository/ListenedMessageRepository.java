package ThoughtsApp.repository;

import ThoughtsApp.models.ListenedMessage;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public interface ListenedMessageRepository extends JpaRepository<ListenedMessage, Long> {

    List<ListenedMessage> findByListenerUserId(UUID listenerUserId);

    List<ListenedMessage> findByMessageId(UUID messageId);

    List<ListenedMessage> findByListenerUserIdAndListenedDate(UUID listenerUserId, LocalDate listenedDate);

    List<ListenedMessage> findAllByListenerUserIdAndListenedDate(UUID listenerUserId, LocalDate listenedDate);
}