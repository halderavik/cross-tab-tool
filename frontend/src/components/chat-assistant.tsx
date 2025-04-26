"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User, Paperclip, BarChart3, Table2 } from "lucide-react"

type Message = {
  role: "assistant" | "user"
  content: string
  suggestion?: string
}

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your SPSS analysis assistant. How can I help you with your data analysis today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        role: "assistant",
        content: "I'm analyzing your data. Please wait...",
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>AI Analysis Assistant</CardTitle>
        <CardDescription>Ask questions about your data or get help with analysis</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[calc(600px-8rem)]">
          <div className="flex flex-col gap-4 p-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>

                  {message.suggestion === "crosstab" && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="secondary" className="h-7">
                        <Table2 className="h-3 w-3 mr-1" />
                        Create Cross-tab
                      </Button>
                    </div>
                  )}

                  {message.suggestion === "banner" && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="secondary" className="h-7">
                        <Table2 className="h-3 w-3 mr-1" />
                        Create Banner Table
                      </Button>
                    </div>
                  )}

                  {message.suggestion === "chart" && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="secondary" className="h-7">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Create Chart
                      </Button>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-3 py-2 bg-muted">
                  <div className="flex gap-1 items-center">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="flex w-full items-center gap-2">
          <Button variant="outline" size="icon" className="shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Ask a question about your data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!input.trim() || isTyping} className="shrink-0">
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
