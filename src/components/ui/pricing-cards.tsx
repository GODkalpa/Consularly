import { Check, MoveRight, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Pricing() {
  return (
    <div className="w-full py-8 sm:py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto text-center">
          <div className="flex justify-center">
            <Badge variant="outline" className="border py-1 px-3 sm:px-4 rounded-lg text-xs sm:text-sm">Pricing</Badge>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[-0.015em] mt-4 sm:mt-5 px-4">
            Prices that make sense!
          </h2>
          <p className="text-center mt-3 sm:mt-5 text-muted-foreground text-sm sm:text-base leading-[1.55] px-4">
            Managing a small business today is already tough.
          </p>
        </div>

        <div className="grid pt-6 sm:pt-8 md:pt-10 text-left grid-cols-1 lg:grid-cols-3 w-full gap-4 sm:gap-6 md:gap-8">
            <Card className="w-full rounded-md" data-animate="up" data-duration="0.7" data-delay="0">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle>
                  <span className="flex flex-row gap-3 sm:gap-4 items-center text-lg sm:text-xl md:text-2xl font-semibold tracking-[-0.005em]">
                    Startup
                  </span>
                </CardTitle>
                <CardDescription className="leading-[1.55] text-sm sm:text-base">
                  Our goal is to streamline SMB trade, making it easier and faster
                  than ever for everyone and everywhere.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-8 justify-start">
                  <p className="flex flex-row  items-center gap-2 text-lg sm:text-xl">
                    <span className="text-3xl sm:text-4xl">TBD</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {" "}
                      / month
                    </span>
                  </p>
                  <div className="flex flex-col gap-3 sm:gap-4 justify-start">
                    <div className="flex flex-row gap-3 sm:gap-4">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p className="text-sm sm:text-base">Fast and reliable</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          We&apos;ve made it fast and reliable.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p className="text-sm sm:text-base">Fast and reliable</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          We&apos;ve made it fast and reliable.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p className="text-sm sm:text-base">Fast and reliable</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          We&apos;ve made it fast and reliable.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-4">
                    Sign up today <MoveRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="w-full rounded-md" data-animate="up" data-duration="0.7" data-delay="0.2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle>
                  <span className="flex flex-row gap-3 sm:gap-4 items-center text-lg sm:text-xl md:text-2xl font-semibold tracking-[-0.005em]">
                    Growth
                  </span>
                </CardTitle>
                <CardDescription className="leading-[1.55] text-sm sm:text-base">
                  Our goal is to streamline SMB trade, making it easier and faster
                  than ever for everyone and everywhere.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-8 justify-start">
                  <p className="flex flex-row  items-center gap-2 text-lg sm:text-xl">
                    <span className="text-3xl sm:text-4xl">TBD</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {" "}
                      / month
                    </span>
                  </p>
                  <div className="flex flex-col gap-3 sm:gap-4 justify-start">
                    <div className="flex flex-row gap-3 sm:gap-4">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p className="text-sm sm:text-base">Fast and reliable</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          We&apos;ve made it fast and reliable.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p className="text-sm sm:text-base">Fast and reliable</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          We&apos;ve made it fast and reliable.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p className="text-sm sm:text-base">Fast and reliable</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          We&apos;ve made it fast and reliable.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button className="gap-4">
                    Sign up today <MoveRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="w-full rounded-md" data-animate="up" data-duration="0.7" data-delay="0.4">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle>
                  <span className="flex flex-row gap-3 sm:gap-4 items-center text-lg sm:text-xl md:text-2xl font-semibold tracking-[-0.005em]">
                    Enterprise
                  </span>
                </CardTitle>
                <CardDescription className="leading-[1.55] text-sm sm:text-base">
                  Our goal is to streamline SMB trade, making it easier and faster
                  than ever for everyone and everywhere.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-8 justify-start">
                  <p className="flex flex-row  items-center gap-2 text-lg sm:text-xl">
                    <span className="text-3xl sm:text-4xl">TBD</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {" "}
                      / month
                    </span>
                  </p>
                  <div className="flex flex-col gap-3 sm:gap-4 justify-start">
                    <div className="flex flex-row gap-3 sm:gap-4">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p className="text-sm sm:text-base">Fast and reliable</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          We&apos;ve made it fast and reliable.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p className="text-sm sm:text-base">Fast and reliable</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          We&apos;ve made it fast and reliable.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-2 text-primary" />
                      <div className="flex flex-col">
                        <p className="text-sm sm:text-base">Fast and reliable</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          We&apos;ve made it fast and reliable.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-4">
                    Book a meeting <PhoneCall className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export { Pricing };
