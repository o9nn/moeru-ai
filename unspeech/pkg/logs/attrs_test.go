package logs

import (
	"testing"

	"github.com/samber/mo"
)

type callerStub struct {
	file     string
	line     int64
	function string
}

func (c callerStub) GetFile() string {
	return c.file
}

func (c callerStub) GetLine() int64 {
	return c.line
}

func (c callerStub) GetFunction() string {
	return c.function
}

func TestCallerAbsent(t *testing.T) {
	t.Parallel()

	attrs := Caller(mo.None[CallerLike]())
	if len(attrs) != 0 {
		t.Fatalf("expected no attributes, got %d", len(attrs))
	}
}

func TestCallerPresent(t *testing.T) {
	t.Parallel()

	attrs := Caller(mo.Some[CallerLike](callerStub{
		file:     "handler.go",
		line:     42,
		function: "example.Handle",
	}))

	if len(attrs) != 3 {
		t.Fatalf("expected three attributes, got %d", len(attrs))
	}
	if attrs[0].Key != "file" || attrs[0].Value.String() != "handler.go" {
		t.Fatalf("unexpected file attribute: %v", attrs[0])
	}
	if attrs[1].Key != "line" || attrs[1].Value.Int64() != 42 {
		t.Fatalf("unexpected line attribute: %v", attrs[1])
	}
	if attrs[2].Key != "function" || attrs[2].Value.String() != "example.Handle" {
		t.Fatalf("unexpected function attribute: %v", attrs[2])
	}
}
