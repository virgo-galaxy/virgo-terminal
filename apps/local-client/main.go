package main

import (
	"flag"
	"log"

	"github.com/virgo-galaxy/virgo-terminal/apps/local-client/internal/client"
)

// Default for local development. Release builds can set main.playgroundURL with -ldflags.
var playgroundURL = "http://127.0.0.1:3000/"

func main() {
	playground := flag.String("playground", playgroundURL, "Playground URL")
	printURL := flag.Bool("print-url", false, "print the launch URL instead of opening a browser")
	flag.Parse()
	if err := client.Run(*playground, *printURL); err != nil {
		log.Fatal(err)
	}
}
