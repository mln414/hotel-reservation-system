import java.sql.DriverManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Read-only account check; prints counts only, never hashes or credentials. */
public class CheckBootstrapExposure {
    public static void main(String[] args) throws Exception {
        String password = System.getenv("VERIFICATION_BOOTSTRAP_PASSWORD");
        if (password == null || password.isBlank()) {
            System.out.println("Bootstrap account exposure check: NOT VERIFIED (no comparison credential)");
            return;
        }
        var encoder = new BCryptPasswordEncoder();
        try (var connection = DriverManager.getConnection(System.getenv("VERIFICATION_DB_URL"),
                System.getenv("VERIFICATION_DB_USER"), System.getenv("VERIFICATION_DB_PASSWORD"))) {
            connection.setReadOnly(true);
            for (String table : new String[]{"staff_users", "customer_users"}) {
                int matches = 0;
                try (var statement = connection.createStatement();
                     var rows = statement.executeQuery("SELECT password_hash FROM " + table)) {
                    while (rows.next()) {
                        String hash = rows.getString(1);
                        if (hash != null && hash.startsWith("$2") && encoder.matches(password, hash)) matches++;
                    }
                }
                System.out.println("Accounts matching configured exposed bootstrap credential (" + table + "): " + matches);
            }
        }
    }
}
