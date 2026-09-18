package com.reforge.app.controller;

import com.reforge.app.entity.Book;
import com.reforge.app.repository.BookRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/health")
@CrossOrigin(origins = "*")
public class MainController {

    private final BookRepository repository;

    public MainController(BookRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<java.util.List<Book>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

}
