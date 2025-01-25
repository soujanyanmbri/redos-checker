package regexExtractor;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.VariableDeclarator;
import com.github.javaparser.ast.expr.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.google.gson.Gson;

public class GenericRegexExtractor {

    private static final Map<String, String> constants = new HashMap<>();
    private static final Map<String, String> patterns = new HashMap<>();
    private static final Set<String> unresolvedVariables = new HashSet<>();

    public static void main(String[] args) throws Exception {

        // Few constants are not going to get resolved, hence suprress those message. Cuz it's expected. 
        System.setErr(new java.io.PrintStream(new java.io.OutputStream() {
            public void write(int b) { }
        }));
   
        Path projectPath = args.length > 0 ? Path.of(args[0]) : Path.of("/Users/soujanyanamburi/Projects/test/api-anomaly-detection");

        Files.walk(projectPath)
            .filter(Files::isRegularFile)
            .filter(path -> path.toString().endsWith(".java"))
            .forEach(GenericRegexExtractor::processJavaFile);

        System.out.println(generateJson());
    }

    private static void processJavaFile(Path filePath) {
        try {
            CompilationUnit cu = StaticJavaParser.parse(filePath);
            cu.findAll(VariableDeclarator.class).forEach(var -> {
                if (var.getInitializer().isPresent()) {
                    processVariableDeclarator(var);
                }
            });
        } catch (Exception e) {
            System.err.println("Error processing file: " + filePath + " - " + e.getMessage());
        }
    }

    private static void processVariableDeclarator(VariableDeclarator var) {
        if (var.getInitializer().isPresent()) {
            Expression initializer = var.getInitializer().get();

            // Handle constants or patterns
            if (initializer instanceof StringLiteralExpr) {
                constants.put(var.getNameAsString(), ((StringLiteralExpr) initializer).getValue());
            } else if (initializer instanceof MethodCallExpr) {
                handleMethodCall(var, (MethodCallExpr) initializer);
            } else {
                unresolvedVariables.add(var.getNameAsString());
            }
        }
    }

    private static void handleMethodCall(VariableDeclarator var, MethodCallExpr methodCall) {
        if (isPatternCompileCall(methodCall)) {
            String resolvedPattern = resolveExpression(methodCall.getArgument(0));
            if (resolvedPattern != null) {
                patterns.put(var.getNameAsString(), resolvedPattern);
            } else {
                unresolvedVariables.add(var.getNameAsString());
            }
        }
    }

    private static boolean isPatternCompileCall(MethodCallExpr methodCall) {
        return "compile".equals(methodCall.getNameAsString()) &&
               methodCall.getScope().isPresent() && "Pattern".equals(methodCall.getScope().get().toString());
    }

    private static String resolveExpression(Expression expr) {
        if (expr instanceof StringLiteralExpr) {
            return ((StringLiteralExpr) expr).getValue();
        } else if (expr instanceof NameExpr) {
            return resolveVariable(((NameExpr) expr).getNameAsString());
        } else if (expr instanceof BinaryExpr) {
            return resolveBinaryExpression((BinaryExpr) expr);
        }
        return null;  // Unresolved expression
    }

    private static String resolveBinaryExpression(BinaryExpr binaryExpr) {
        if (binaryExpr.getOperator() == BinaryExpr.Operator.PLUS) {
            String left = resolveExpression(binaryExpr.getLeft());
            String right = resolveExpression(binaryExpr.getRight());
            if (left != null && right != null) {
                return left + right;  // Concatenate resolved left and right
            }
        }
        return null;
    }

    private static String resolveVariable(String varName) {
        return constants.getOrDefault(varName, null);
    }

    private static String normalizeRegex(String pattern) {
        pattern = pattern.trim();
        pattern = pattern.replaceAll("\\\\\\\\", "\\\\");
        return pattern;
    }

    private static String generateJson() {
        Gson gson = new Gson();
        Map<String, Object> result = new HashMap<>();
        Map<String, String> cleanedPatterns = new HashMap<>();
        for (Map.Entry<String, String> entry : patterns.entrySet()) {
            cleanedPatterns.put(entry.getKey(), normalizeRegex(entry.getValue()));
        }

        result.put("patterns", cleanedPatterns);
        return gson.toJson(result);
    }
}
