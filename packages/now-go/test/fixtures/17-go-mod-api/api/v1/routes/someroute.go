package routes

import (
	"fmt"
	"net/http"

	"github.com/vercel/does-not-exist/api/_pkg/somepackage"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello %v", somepackage.Foo)
}
