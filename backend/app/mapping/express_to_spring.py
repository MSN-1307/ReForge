from typing import Dict, Any, List, Tuple
from pathlib import Path

class ExpressToSpringMapper:
    """
    Deterministic Migration Engine for Node.js / Express -> Spring Boot / Java.
    Maps:
      - Express Route definitions -> Spring Boot @RestController
      - Mongoose Schema / Model -> Spring Data JPA @Entity
      - Data access queries -> Spring Data JpaRepository
      - package.json -> Maven pom.xml
      - application.properties
    """
    def __init__(self, package_name: str = "com.reforge.app"):
        self.package_name = package_name

    def map_model_to_jpa_entity(self, model: Dict[str, Any]) -> Tuple[str, str]:
        """
        Transforms a Mongoose Model into a JPA @Entity Java class.
        Returns (relative_file_path, java_source_code).
        """
        model_name = model.get("name", "Item")
        fields = model.get("fields", {})

        type_map = {
            "String": "String",
            "Number": "Double",
            "Boolean": "Boolean",
            "Date": "java.time.LocalDateTime",
            "Array": "java.util.List<String>",
            "ObjectId": "Long"
        }

        field_declarations = []
        getters_setters = []

        # Always ensure Long id exists
        field_declarations.append("    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n")
        getters_setters.append(f"""    public Long getId() {{
        return id;
    }}

    public void setId(Long id) {{
        this.id = id;
    }}
""")

        for field_name, field_spec in fields.items():
            if field_name.lower() in ["id", "_id"]:
                continue
            raw_type = field_spec.get("type", "String") if isinstance(field_spec, dict) else str(field_spec)
            java_type = type_map.get(raw_type, "String")
            is_req = field_spec.get("required", False) if isinstance(field_spec, dict) else False

            col_annot = "    @Column(nullable = false)\n" if is_req else "    @Column\n"
            field_declarations.append(f"{col_annot}    private {java_type} {field_name};\n")

            cap_field = field_name[0].upper() + field_name[1:] if len(field_name) > 1 else field_name.upper()
            getters_setters.append(f"""    public {java_type} get{cap_field}() {{
        return {field_name};
    }}

    public void set{cap_field}({java_type} {field_name}) {{
        this.field_name = {field_name};
    }}
""".replace("this.field_name", f"this.{field_name}"))

        code = f"""package {self.package_name}.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "{model_name.lower()}s")
public class {model_name} implements Serializable {{

{"".join(field_declarations)}
    public {model_name}() {{
    }}

{"".join(getters_setters)}
}}
"""
        rel_path = f"src/main/java/{self.package_name.replace('.', '/')}/entity/{model_name}.java"
        return rel_path, code

    def map_repository(self, model_name: str) -> Tuple[str, str]:
        """Generates Spring Data JPA Repository interface."""
        code = f"""package {self.package_name}.repository;

import {self.package_name}.entity.{model_name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface {model_name}Repository extends JpaRepository<{model_name}, Long> {{
}}
"""
        rel_path = f"src/main/java/{self.package_name.replace('.', '/')}/repository/{model_name}Repository.java"
        return rel_path, code

    def map_routes_to_controller(self, controller_name: str, base_path: str, routes: List[Dict[str, Any]], model_name: str = "Item") -> Tuple[str, str]:
        """
        Transforms Express routes into Spring Boot @RestController.
        """
        methods_code = []

        # Find clean base path if routes share prefix
        method_annot_map = {
            "GET": "@GetMapping",
            "POST": "@PostMapping",
            "PUT": "@PutMapping",
            "DELETE": "@DeleteMapping",
            "PATCH": "@PatchMapping"
        }

        for idx, r in enumerate(routes):
            http_method = r.get("method", "GET").upper()
            raw_path = r.get("path", "/")
            annot = method_annot_map.get(http_method, "@GetMapping")
            
            # Convert Express path :param to Spring {param}
            spring_path = raw_path
            for param in r.get("path_params", []):
                spring_path = spring_path.replace(f":{param}", f"{{{param}}}")

            # Strip base_path from route if duplicate
            sub_path = spring_path
            if base_path != "/" and sub_path.startswith(base_path):
                sub_path = sub_path[len(base_path):]
                if not sub_path:
                    sub_path = ""
                elif not sub_path.startswith("/"):
                    sub_path = "/" + sub_path

            status_code = r.get("status_code", 200)
            status_annot = f'    @ResponseStatus(HttpStatus.{"CREATED" if status_code == 201 else "OK"})\n'

            # Build method signature & arguments
            args = []
            for p in r.get("path_params", []):
                args.append(f"@PathVariable Long {p}")

            if http_method in ["POST", "PUT", "PATCH"]:
                args.append(f"@RequestBody {model_name} payload")

            args_str = ", ".join(args)
            method_name = f"handle{http_method.capitalize()}_{idx+1}"

            # Meaningful naming
            if http_method == "GET" and not r.get("path_params"):
                method_name = "getAll"
                body = f"""        return ResponseEntity.ok(repository.findAll());"""
                return_type = f"ResponseEntity<java.util.List<{model_name}>>"
            elif http_method == "GET" and r.get("path_params"):
                method_name = "getById"
                param_name = r.get("path_params")[0]
                body = f"""        return repository.findById({param_name})
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());"""
                return_type = f"ResponseEntity<{model_name}>"
            elif http_method == "POST":
                method_name = "create"
                body = f"""        {model_name} saved = repository.save(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);"""
                return_type = f"ResponseEntity<{model_name}>"
            elif http_method == "PUT":
                method_name = "update"
                param_name = r.get("path_params")[0] if r.get("path_params") else "id"
                body = f"""        if (!repository.existsById({param_name})) {{
            return ResponseEntity.notFound().build();
        }}
        payload.setId({param_name});
        return ResponseEntity.ok(repository.save(payload));"""
                return_type = f"ResponseEntity<{model_name}>"
            elif http_method == "DELETE":
                method_name = "delete"
                param_name = r.get("path_params")[0] if r.get("path_params") else "id"
                body = f"""        if (!repository.existsById({param_name})) {{
            return ResponseEntity.notFound().build();
        }}
        repository.deleteById({param_name});
        return ResponseEntity.noContent().build();"""
                return_type = "ResponseEntity<Void>"
            else:
                body = f"""        return ResponseEntity.ok().build();"""
                return_type = "ResponseEntity<Object>"

            sub_path_expr = f'("{sub_path}")' if sub_path else ""
            methods_code.append(f"""    {annot}{sub_path_expr}
{status_annot}    public {return_type} {method_name}({args_str}) {{
{body}
    }}
""")

        code = f"""package {self.package_name}.controller;

import {self.package_name}.entity.{model_name};
import {self.package_name}.repository.{model_name}Repository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("{base_path}")
@CrossOrigin(origins = "*")
public class {controller_name}Controller {{

    private final {model_name}Repository repository;

    public {controller_name}Controller({model_name}Repository repository) {{
        this.repository = repository;
    }}

{"".join(methods_code)}
}}
"""
        rel_path = f"src/main/java/{self.package_name.replace('.', '/')}/controller/{controller_name}Controller.java"
        return rel_path, code

    def generate_main_application(self) -> Tuple[str, str]:
        """Generates Spring Boot Application entrypoint."""
        code = f"""package {self.package_name};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {{
    public static void main(String[] args) {{
        SpringApplication.run(Application.class, args);
    }}
}}
"""
        rel_path = f"src/main/java/{self.package_name.replace('.', '/')}/Application.java"
        return rel_path, code

    def generate_pom_xml(self, project_name: str, upgrades: List[str] = None) -> Tuple[str, str]:
        """Generates Maven pom.xml with optional modernizations (OpenAPI, Redis)."""
        upgrades = upgrades or []
        
        openapi_dep = ""
        if "openapi" in upgrades:
            openapi_dep = """
        <!-- Modernization: OpenAPI 3 / Swagger Documentation -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>"""

        redis_dep = ""
        if "redis" in upgrades:
            redis_dep = """
        <!-- Modernization: Redis Caching -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-cache</artifactId>
        </dependency>"""

        code = f"""<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.4</version>
        <relativePath/>
    </parent>
    <groupId>{self.package_name}</groupId>
    <artifactId>{project_name.lower().replace(' ', '-')}</artifactId>
    <version>1.0.0</version>
    <name>{project_name}</name>
    <description>Modernized Spring Boot application generated by ReForge</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        {openapi_dep}
        {redis_dep}
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
"""
        return "pom.xml", code

    def generate_application_properties(self, port: int = 8080) -> Tuple[str, str]:
        """Generates src/main/resources/application.properties."""
        code = f"""# Spring Boot Configuration generated by ReForge
server.port={port}
spring.application.name=reforge-target-app

# In-memory H2 Database for instant execution & behavioral equivalence testing
spring.datasource.url=jdbc:h2:mem:reforgedb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# H2 Web Console
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
"""
        return "src/main/resources/application.properties", code

    def generate_dockerfile(self) -> Tuple[str, str]:
        """Generates multi-stage Dockerfile for containerized deployment."""
        code = """# Modernization Upgrade: Multi-Stage Dockerfile generated by ReForge
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
"""
        return "Dockerfile", code

mapping_engine = ExpressToSpringMapper()
