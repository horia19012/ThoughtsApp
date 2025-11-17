package ThoughtsApp.services;

import ThoughtsApp.models.ListenedMessage;
import ThoughtsApp.repository.ListenedMessageRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ListenedMessageService {

    private final ListenedMessageRepository listenedMessageRepository;

    public ListenedMessageService(ListenedMessageRepository listenedMessageRepository) {
        this.listenedMessageRepository = listenedMessageRepository;
    }

    public ListenedMessage logMessageListen(UUID listenerUserId, UUID ownerUserId, UUID messageId, LocalDate listenedDate) {
        ListenedMessage listened = new ListenedMessage();
        listened.setListenerUserId(listenerUserId);
        listened.setMessageOwnerUserId(ownerUserId);
        listened.setMessageId(messageId);
        listened.setListenedDate(listenedDate);
        listenedMessageRepository.save(listened);
        return listened;
    }

    public List<UUID> getListenedMessageIds(UUID listenerUserId, LocalDate date) {
        return listenedMessageRepository.findAllByListenerUserIdAndListenedDate(
                        listenerUserId, date
                ).stream()
                .map(ListenedMessage::getMessageId)
                .toList();
    }

    public List<UUID> getAlreadyListenedMessages(UUID listenerId) {
        return listenedMessageRepository.findByListenerUserId(listenerId)
                .stream()
                .map(ListenedMessage::getMessageId)
                .toList();
    }

}
