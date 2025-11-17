package ThoughtsApp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import ThoughtsApp.properties.AwsProperties;

@SpringBootApplication
@EnableConfigurationProperties(AwsProperties.class)
public class ThoughtsAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(ThoughtsAppApplication.class, args);
	}

}
