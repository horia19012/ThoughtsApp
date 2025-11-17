package ThoughtsApp.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ListenedMessageDto {
    private UUID listenerUserId;
    private UUID messageOwnerUserId;
    private UUID messageId;
    private LocalDate listenedDate;
}