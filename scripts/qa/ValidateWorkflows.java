import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

/** Local syntax/structure check, not a replacement for an actual GitHub Actions run. */
public class ValidateWorkflows {
    public static void main(String[] args) throws Exception {
        for (String file : args) {
            Object document = new Yaml(new SafeConstructor(new LoaderOptions())).load(Files.readString(Path.of(file)));
            if (!(document instanceof Map<?, ?> workflow) || !workflow.containsKey("jobs")
                    || !(workflow.containsKey("on") || workflow.containsKey(Boolean.TRUE))) {
                throw new IllegalArgumentException("Workflow structure invalid: " + file);
            }
            System.out.println("YAML syntax/structure PASS: " + file);
        }
    }
}
