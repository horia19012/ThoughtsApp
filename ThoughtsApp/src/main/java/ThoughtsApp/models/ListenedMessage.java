package ThoughtsApp.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "listened_messages")
public class ListenedMessage {


    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private UUID listenerUserId;

    @Column(nullable = false)
    private UUID messageOwnerUserId;

    @Column(nullable = false, unique = true)
    private UUID messageId;

    @Column(nullable = false)
    private LocalDate listenedDate;

    // Convenience constructor
    public ListenedMessage(UUID listenerUserId, UUID messageOwnerUserId, UUID messageId, LocalDate listenedDate) {
        this.listenerUserId = listenerUserId;
        this.messageOwnerUserId = messageOwnerUserId;
        this.messageId = messageId;
        this.listenedDate = listenedDate;
    }

}
